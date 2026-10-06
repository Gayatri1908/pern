"""Integration and unit tests for telemetry ingestion, threshold alerting, and WebSocket live push."""

from __future__ import annotations

import json
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import hash_password
from app.models.company import Company
from app.models.product import DeviceCredential, Product, Threshold
from app.models.telemetry import ProductTelemetry
from app.models.user import User
from app.models.alert import Alert
from app.services.mqtt_worker import process_telemetry
from app.utils.redis import get_redis
from app.main import app as fastapi_app


@pytest.fixture
async def telemetry_setup(db: AsyncSession):
    """Seed users, products, and credentials for telemetry tests."""
    company = Company(name="Test Energy")
    db.add(company)
    await db.flush()

    customer = User(
        email="customer@example.com",
        password_hash=hash_password("password123"),
        role="Customer",
        company_id=company.id,
        is_active=True,
    )
    admin = User(
        email="admin@example.com",
        password_hash=hash_password("password123"),
        role="Admin",
        is_active=True,
    )
    db.add_all([customer, admin])
    await db.commit()

    product = Product(
        product_code="PRD-TEL-100",
        category="turbine",
        serial_number="SER-TEL-100",
        owner_user_id=customer.id,
        status="offline",
    )
    db.add(product)
    await db.flush()

    raw_token = "tok_secret_device_123"
    credential = DeviceCredential(
        product_id=product.id,
        token_hash=hash_password(raw_token),
    )
    db.add(credential)
    await db.commit()

    return {
        "customer": customer,
        "admin": admin,
        "product": product,
        "raw_token": raw_token,
    }


async def get_token_for_user(client: AsyncClient, email: str) -> str:
    """Helper to authenticate and retrieve access token."""
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_process_telemetry_valid(telemetry_setup, db: AsyncSession):
    """Verify processing valid telemetry registers in DB, sets product online, and caches in Redis."""
    product = telemetry_setup["product"]
    raw_token = telemetry_setup["raw_token"]

    payload = {
        "product_id": str(product.id),
        "token": raw_token,
        "voltage": 230.5,
        "current": 10.2,
        "power": 2351.1,
        "energy": 1420.5,
        "battery_pct": 95.0,
        "wind_speed": 7.5,
        "comm_status": "online",
    }

    # Run processing loop manually
    await process_telemetry(json.dumps(payload))

    # Verify Database entry
    result = await db.execute(select(ProductTelemetry).filter(ProductTelemetry.product_id == product.id))
    records = result.scalars().all()
    assert len(records) == 1
    assert records[0].voltage == 230.5
    assert records[0].battery_pct == 95.0

    # Verify Product status is online
    await db.refresh(product)
    assert product.status == "online"

    # Verify cached latest state in Redis
    redis = get_redis()
    cache_key = f"telemetry:latest:{product.id}"
    cached_str = await redis.get(cache_key)
    assert cached_str is not None
    cached = json.loads(cached_str)
    assert cached["voltage"] == 230.5


@pytest.mark.asyncio
async def test_process_telemetry_unauthorized(telemetry_setup, db: AsyncSession):
    """Verify telemetry with incorrect token is rejected and doesn't store data."""
    product = telemetry_setup["product"]

    payload = {
        "product_id": str(product.id),
        "token": "wrong_token",
        "voltage": 230.5,
    }

    await process_telemetry(json.dumps(payload))

    # DB should remain empty
    result = await db.execute(select(ProductTelemetry).filter(ProductTelemetry.product_id == product.id))
    assert len(result.scalars().all()) == 0


@pytest.mark.asyncio
async def test_process_telemetry_threshold_breach_raises_alert(telemetry_setup, db: AsyncSession):
    """Verify that a threshold breach creates an alert record in the database."""
    product = telemetry_setup["product"]
    raw_token = telemetry_setup["raw_token"]

    # Configure a threshold for wind speed (max 12.0 m/s)
    threshold = Threshold(
        product_id=product.id,
        metric_name="wind_speed",
        max_value=12.0,
        severity="critical",
    )
    db.add(threshold)
    await db.commit()

    # Ingest breaching payload (15.5 m/s wind speed)
    payload = {
        "product_id": str(product.id),
        "token": raw_token,
        "wind_speed": 15.5,
    }
    await process_telemetry(json.dumps(payload))

    # Verify alert is created in DB
    alert_result = await db.execute(select(Alert).filter(Alert.product_id == product.id))
    alerts = alert_result.scalars().all()
    assert len(alerts) == 1
    assert alerts[0].metric == "wind_speed"
    assert alerts[0].value == 15.5
    assert alerts[0].severity == "critical"
    assert "above maximum threshold" in alerts[0].suggested_solution


@pytest.mark.asyncio
async def test_get_latest_telemetry_endpoint(client: AsyncClient, telemetry_setup, db: AsyncSession):
    """Verify HTTP GET /latest endpoint fetches cached or DB telemetry with scoping."""
    cust_token = await get_token_for_user(client, "customer@example.com")
    product = telemetry_setup["product"]
    raw_token = telemetry_setup["raw_token"]

    # Ingest a reading first
    payload = {
        "product_id": str(product.id),
        "token": raw_token,
        "voltage": 230.5,
    }
    await process_telemetry(json.dumps(payload))

    # Query latest endpoint
    response = await client.get(
        f"/api/v1/products/{product.id}/telemetry/latest",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert response.status_code == 200
    assert response.json()["voltage"] == 230.5


@pytest.mark.asyncio
async def test_websocket_live_telemetry_flow(client: AsyncClient, telemetry_setup, db: AsyncSession):
    """Verify WebSocket connection accepts token, subscribes, and receives pushed updates."""
    cust_token = await get_token_for_user(client, "customer@example.com")
    product = telemetry_setup["product"]

    # Commit the transaction so other database sessions can query the seeded data
    await db.commit()

    import app.database
    from fastapi.testclient import TestClient

    # Clear overrides and database globals so TestClient handles its own event loop and engine
    fastapi_app.dependency_overrides.clear()
    app.database.engine = None
    app.database.async_session_factory = None

    with TestClient(fastapi_app) as sync_client:
        ws_url = f"/api/v1/products/{product.id}/telemetry/live?token={cust_token}"
        with sync_client.websocket_connect(ws_url) as websocket:
            # Emulate a publish from the ingestion worker to the Redis pub/sub channel
            redis = get_redis()
            channel_name = f"telemetry:live:{product.id}"
            
            # Wait up to 5 seconds for subscription to be active to avoid race conditions
            import asyncio
            for _ in range(50):
                numsub = await redis.pubsub_numsub(channel_name)
                if numsub and numsub[0][1] > 0:
                    break
                await asyncio.sleep(0.1)

            test_payload = {
                "time": "2026-06-25T20:00:00Z",
                "product_id": str(product.id),
                "voltage": 222.2,
            }
            await redis.publish(channel_name, json.dumps(test_payload))

            # Receive data from WebSocket
            received_data = websocket.receive_text()
            parsed = json.loads(received_data)
            assert parsed["voltage"] == 222.2
            assert parsed["product_id"] == str(product.id)


@pytest.mark.asyncio
async def test_websocket_live_telemetry_unauthorized(client: AsyncClient, telemetry_setup, db: AsyncSession):
    """Verify WebSocket rejects connections with invalid tokens or unauthorized scopes."""
    product = telemetry_setup["product"]

    # Create another customer and authenticate them first
    other_cust = User(
        email="other@example.com",
        password_hash=hash_password("password123"),
        role="Customer",
        is_active=True,
    )
    db.add(other_cust)
    await db.commit()

    other_token = await get_token_for_user(client, "other@example.com")

    # Commit all changes
    await db.commit()

    import app.database
    from starlette.websockets import WebSocketDisconnect
    from fastapi.testclient import TestClient

    fastapi_app.dependency_overrides.clear()
    app.database.engine = None
    app.database.async_session_factory = None

    with TestClient(fastapi_app) as sync_client:
        # 1. No token -> closes connection immediately
        with pytest.raises(WebSocketDisconnect):
            with sync_client.websocket_connect(f"/api/v1/products/{product.id}/telemetry/live"):
                pass

        # 2. Invalid token -> closes connection immediately
        with pytest.raises(WebSocketDisconnect):
            with sync_client.websocket_connect(f"/api/v1/products/{product.id}/telemetry/live?token=invalid"):
                pass

        # 3. Unauthorized customer tries to access another customer's product
        with pytest.raises(WebSocketDisconnect):
            with sync_client.websocket_connect(f"/api/v1/products/{product.id}/telemetry/live?token={other_token}"):
                pass


