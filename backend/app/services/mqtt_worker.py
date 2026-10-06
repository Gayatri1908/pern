"""MQTT Telemetry Ingestion Worker Service."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import json
import structlog
from aiomqtt import Client, MqttError
from sqlalchemy.future import select

from app.auth.security import verify_password
from app.config import get_settings
from app.database import get_session_factory
from app.models.alert import Alert
from app.models.product import DeviceCredential, Product, Threshold
from app.models.telemetry import ProductTelemetry
from app.models.user import User
from app.schemas.telemetry import TelemetryIngest
from app.utils.redis import get_redis

logger = structlog.stdlib.get_logger(__name__)


async def process_telemetry(payload_str: str) -> None:
    """Validate, authenticate, store, and publish incoming device telemetry."""
    try:
        data = json.loads(payload_str)
    except json.JSONDecodeError:
        logger.error("mqtt_payload_invalid_json")
        return

    product_id_str = data.get("product_id")
    token = data.get("token")

    if not product_id_str:
        logger.error("mqtt_payload_missing_product_id")
        return

    session_factory = get_session_factory()
    async with session_factory() as db:
        # 1. Device Authentication
        cred_stmt = select(DeviceCredential).filter(DeviceCredential.product_id == product_id_str)
        cred_res = await db.execute(cred_stmt)
        credential = cred_res.scalars().first()

        if not credential:
            logger.error("device_credential_not_found", product_id=product_id_str)
            return

        if not token or not verify_password(token, credential.token_hash):
            logger.error("device_authentication_failed", product_id=product_id_str)
            return

        # 2. Validation
        try:
            telemetry_data = TelemetryIngest(**data)
        except Exception as e:
            logger.error("telemetry_validation_failed", error=str(e), product_id=product_id_str)
            return

        # 3. Store Telemetry
        time_now = datetime.now(timezone.utc)
        telemetry = ProductTelemetry(
            time=time_now,
            product_id=telemetry_data.product_id,
            voltage=telemetry_data.voltage,
            current=telemetry_data.current,
            power=telemetry_data.power,
            energy=telemetry_data.energy,
            battery_pct=telemetry_data.battery_pct,
            wind_speed=telemetry_data.wind_speed,
            rope_tension=telemetry_data.rope_tension,
            rotor_rpm=telemetry_data.rotor_rpm,
            comm_status=telemetry_data.comm_status or "online",
        )
        db.add(telemetry)

        # 4. Mark Product Online
        prod_stmt = select(Product).filter(Product.id == telemetry_data.product_id)
        prod_res = await db.execute(prod_stmt)
        product = prod_res.scalars().first()
        if product:
            product.status = "online"
            db.add(product)

        # 5. Check Threshold Limits & Raise Alerts
        thresh_stmt = select(Threshold).filter(Threshold.product_id == telemetry_data.product_id)
        thresh_res = await db.execute(thresh_stmt)
        thresholds = thresh_res.scalars().all()

        redis = get_redis()

        # Fetch product owner details for notifications
        owner = None
        if product and product.owner_user_id:
            user_res = await db.execute(select(User).filter(User.id == product.owner_user_id))
            owner = user_res.scalars().first()

        for t in thresholds:
            val = getattr(telemetry_data, t.metric_name, None)
            if val is not None:
                is_breached = False
                reason = ""
                if t.min_value is not None and val < t.min_value:
                    is_breached = True
                    reason = f"{t.metric_name} value {val} is below minimum threshold limit {t.min_value}."
                elif t.max_value is not None and val > t.max_value:
                    is_breached = True
                    reason = f"{t.metric_name} value {val} is above maximum threshold limit {t.max_value}."

                if is_breached:
                    alert = Alert(
                        product_id=telemetry_data.product_id,
                        metric=t.metric_name,
                        value=val,
                        severity=t.severity,
                        status="open",
                        suggested_solution=f"Check {t.metric_name}. Reason: {reason}",
                    )
                    db.add(alert)
                    await db.flush()  # populate alert.id

                    alert_dict = {
                        "id": str(alert.id),
                        "product_id": str(alert.product_id),
                        "metric": alert.metric,
                        "value": alert.value,
                        "severity": alert.severity,
                        "status": alert.status,
                        "suggested_solution": alert.suggested_solution,
                        "created_at": time_now.isoformat(),
                    }
                    # Publish alert details to pub/sub channel
                    await redis.publish(f"alerts:product:{telemetry_data.product_id}", json.dumps(alert_dict))
                    logger.warning("threshold_breach_alert_raised", product_id=product_id_str, metric=t.metric_name)

                    # Dispatch notifications
                    if owner:
                        from app.services.notifications import send_email_notification, send_sms_notification
                        alert_msg = f"Alert for product {product.product_code}: {reason}"
                        asyncio.create_task(
                            send_email_notification(
                                recipient=owner.email,
                                subject=f"CRITICAL: {t.metric_name} threshold breached",
                                body=alert_msg,
                            )
                        )
                        if owner.phone:
                            asyncio.create_task(
                                send_sms_notification(
                                    phone_number=owner.phone,
                                    message=alert_msg,
                                )
                            )

        await db.commit()

        # 6. Cache latest state in Redis
        latest_dict = {
            "time": time_now.isoformat(),
            "product_id": str(telemetry_data.product_id),
            "voltage": telemetry_data.voltage,
            "current": telemetry_data.current,
            "power": telemetry_data.power,
            "energy": telemetry_data.energy,
            "battery_pct": telemetry_data.battery_pct,
            "wind_speed": telemetry_data.wind_speed,
            "rope_tension": telemetry_data.rope_tension,
            "rotor_rpm": telemetry_data.rotor_rpm,
            "comm_status": telemetry_data.comm_status or "online",
        }
        await redis.set(f"telemetry:latest:{telemetry_data.product_id}", json.dumps(latest_dict))

        # 7. Publish live telemetry payload to Redis pub/sub for WebSockets
        await redis.publish(f"telemetry:live:{telemetry_data.product_id}", json.dumps(latest_dict))
        logger.info("telemetry_ingested_and_processed", product_id=product_id_str)


async def run_worker() -> None:
    """Loop to maintain MQTT connection and receive telemetry messages."""
    settings = get_settings()
    logger.info("mqtt_worker_starting", host=settings.mqtt_broker_host, port=settings.mqtt_broker_port)

    while True:
        try:
            async with Client(hostname=settings.mqtt_broker_host, port=settings.mqtt_broker_port) as client:
                logger.info("mqtt_worker_connected")
                await client.subscribe("devices/+/telemetry")
                async for message in client.messages:
                    payload = (
                        message.payload.decode() if isinstance(message.payload, bytes) else str(message.payload)
                    )
                    asyncio.create_task(process_telemetry(payload))
        except (MqttError, Exception) as e:
            logger.error("mqtt_worker_error_reconnecting", error=str(e))
            await asyncio.sleep(5)  # Pause before attempting reconnect
