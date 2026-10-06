"""Telemetry WebSocket and HTTP queries router."""

from __future__ import annotations

from datetime import datetime, timezone
import json
from uuid import UUID
import structlog
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import decode_token
from app.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.product import Product
from app.models.telemetry import ProductTelemetry, TelemetryRollup
from app.models.user import User
from app.schemas.telemetry import TelemetryRead, TelemetryRollupRead
from app.utils.redis import get_redis

logger = structlog.stdlib.get_logger(__name__)

router = APIRouter()


@router.get("/{product_id}/telemetry/latest", response_model=TelemetryRead)
async def get_latest_telemetry(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the latest telemetry reading for a device (scoped to owner/Admin)."""
    # 1. Product permissions check
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    if current_user.role.lower() != "admin" and product.owner_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view telemetry for this product.",
        )

    # 2. Try reading from Redis cache
    redis = get_redis()
    cache_key = f"telemetry:latest:{product_id}"
    cached_data = await redis.get(cache_key)

    if cached_data:
        try:
            parsed = json.loads(cached_data)
            logger.info("latest_telemetry_loaded_from_cache", product_id=str(product_id))
            return TelemetryRead(
                time=parsed["time"],
                product_id=parsed["product_id"],
                voltage=parsed.get("voltage"),
                current=parsed.get("current"),
                power=parsed.get("power"),
                energy=parsed.get("energy"),
                battery_pct=parsed.get("battery_pct"),
                wind_speed=parsed.get("wind_speed"),
                rope_tension=parsed.get("rope_tension"),
                rotor_rpm=parsed.get("rotor_rpm"),
                comm_status=parsed.get("comm_status"),
            )
        except Exception as e:
            logger.error("parse_cached_telemetry_failed", error=str(e))

    # 3. Fallback to Database query
    db_stmt = (
        select(ProductTelemetry)
        .filter(ProductTelemetry.product_id == product_id)
        .order_by(ProductTelemetry.time.desc())
        .limit(1)
    )
    db_res = await db.execute(db_stmt)
    telemetry = db_res.scalars().first()

    if not telemetry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry data found for this device.",
        )

    # Populate cache
    latest_dict = {
        "time": telemetry.time.isoformat() if telemetry.time else None,
        "product_id": str(telemetry.product_id),
        "voltage": telemetry.voltage,
        "current": telemetry.current,
        "power": telemetry.power,
        "energy": telemetry.energy,
        "battery_pct": telemetry.battery_pct,
        "wind_speed": telemetry.wind_speed,
        "rope_tension": telemetry.rope_tension,
        "rotor_rpm": telemetry.rotor_rpm,
        "comm_status": telemetry.comm_status,
    }
    await redis.set(cache_key, json.dumps(latest_dict))

    logger.info("latest_telemetry_loaded_from_db", product_id=str(product_id))
    return telemetry


@router.websocket("/{product_id}/telemetry/live")
async def websocket_live_telemetry(
    websocket: WebSocket,
    product_id: UUID,
    token: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """WebSocket endpoint pushing live telemetry updates from Redis Pub/Sub."""
    # 1. Authorization
    try:
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Decode token
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        if not user_id_str or token_type != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Query User
        user_res = await db.execute(select(User).filter(User.id == user_id_str))
        user = user_res.scalars().first()
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Query Product and check permissions
        prod_res = await db.execute(select(Product).filter(Product.id == product_id))
        product = prod_res.scalars().first()
        if not product:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        if user.role.lower() != "admin" and product.owner_user_id != user.id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    except Exception as e:
        logger.error("websocket_authorization_failed", error=str(e))
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Connection Accepted
    await websocket.accept()
    logger.info("websocket_connection_established", product_id=str(product_id), email=user.email)

    # 3. Redis Pub/Sub Loop
    redis = get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"telemetry:live:{product_id}")

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                # Forward published telemetry payload directly
                await websocket.send_text(data)
    except WebSocketDisconnect:
        logger.info("websocket_connection_disconnected", product_id=str(product_id))
    except Exception as e:
        logger.error("websocket_push_error", error=str(e), product_id=str(product_id))
    finally:
        await pubsub.unsubscribe(f"telemetry:live:{product_id}")
        await pubsub.close()


@router.get("/{product_id}/telemetry/history")
async def get_historical_telemetry(
    product_id: UUID,
    resolution: str = "hourly",
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve historical telemetry scoped to owner or Admin. Falls back to dynamic aggregation if rollup table is empty."""
    # 1. Product permissions check
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    if current_user.role.lower() != "admin" and product.owner_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view telemetry for this product.",
        )

    # Time bounds configuration
    if not end_time:
        end_time = datetime.now(timezone.utc)
    if not start_time:
        from datetime import timedelta
        if resolution == "raw":
            start_time = end_time - timedelta(hours=24)
        elif resolution == "hourly":
            start_time = end_time - timedelta(days=7)
        else:
            start_time = end_time - timedelta(days=30)

    res_lower = resolution.lower()

    if res_lower == "raw":
        stmt = (
            select(ProductTelemetry)
            .filter(
                ProductTelemetry.product_id == product_id,
                ProductTelemetry.time >= start_time,
                ProductTelemetry.time <= end_time,
            )
            .order_by(ProductTelemetry.time.asc())
        )
        res = await db.execute(stmt)
        return res.scalars().all()

    # Query pre-computed rollups
    stmt = (
        select(TelemetryRollup)
        .filter(
            TelemetryRollup.product_id == product_id,
            TelemetryRollup.resolution == res_lower,
            TelemetryRollup.bucket >= start_time,
            TelemetryRollup.bucket <= end_time,
        )
        .order_by(TelemetryRollup.bucket.asc())
    )
    res = await db.execute(stmt)
    rollups = res.scalars().all()

    if rollups:
        return rollups

    # Fallback: Compute dynamic rollups on the fly
    db_res_map = {
        "hourly": "hour",
        "daily": "day",
        "monthly": "month",
    }
    trunc_val = db_res_map.get(res_lower, "hour")

    from sqlalchemy import literal_column
    trunc_expr = func.date_trunc(literal_column(f"'{trunc_val}'"), ProductTelemetry.time)

    agg_stmt = (
        select(
            trunc_expr.label("bucket"),
            func.avg(ProductTelemetry.voltage).label("avg_voltage"),
            func.avg(ProductTelemetry.power).label("avg_power"),
            (func.max(ProductTelemetry.energy) - func.min(ProductTelemetry.energy)).label("energy_sum"),
        )
        .filter(
            ProductTelemetry.product_id == product_id,
            ProductTelemetry.time >= start_time,
            ProductTelemetry.time <= end_time,
        )
        .group_by(trunc_expr)
        .order_by(trunc_expr.asc())
    )

    agg_res = await db.execute(agg_stmt)
    rows = agg_res.all()

    fallback_list = []
    for r in rows:
        fallback_list.append({
            "bucket": r.bucket,
            "product_id": product_id,
            "resolution": res_lower,
            "avg_voltage": r.avg_voltage,
            "avg_power": r.avg_power,
            "energy_sum": r.energy_sum or 0.0,
        })
    return fallback_list
