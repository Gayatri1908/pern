"""Integration tests for telemetry historical rollups and analytics queries."""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import hash_password
from app.models.company import Company
from app.models.product import Product
from app.models.telemetry import ProductTelemetry, TelemetryRollup
from app.models.user import User
from app.services.rollup_service import compute_rollups


@pytest.fixture
async def analytics_setup(db: AsyncSession):
    """Seed data for historical telemetry and rollups tests."""
    company = Company(name="Test Energy Grid")
    db.add(company)
    await db.flush()

    customer_a = User(
        email="cust_a@example.com",
        password_hash=hash_password("password123"),
        role="Customer",
        company_id=company.id,
        is_active=True,
    )
    customer_b = User(
        email="cust_b@example.com",
        password_hash=hash_password("password123"),
        role="Customer",
        is_active=True,
    )
    admin = User(
        email="ops_admin@example.com",
        password_hash=hash_password("password123"),
        role="Admin",
        is_active=True,
    )
    db.add_all([customer_a, customer_b, admin])
    await db.commit()

    product_a = Product(
        product_code="PRD-AAA-100",
        category="turbine",
        serial_number="SER-AAA-100",
        owner_user_id=customer_a.id,
        status="offline",
    )
    db.add(product_a)
    await db.flush()

    # Seed raw telemetry readings for Product A
    base_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) - timedelta(days=2)
    
    # Hour 1: 3 readings
    t1 = ProductTelemetry(time=base_time, product_id=product_a.id, voltage=220.0, power=1000.0, energy=100.0)
    t2 = ProductTelemetry(time=base_time + timedelta(minutes=15), product_id=product_a.id, voltage=230.0, power=1100.0, energy=105.0)
    t3 = ProductTelemetry(time=base_time + timedelta(minutes=30), product_id=product_a.id, voltage=240.0, power=1200.0, energy=110.0)
    
    # Hour 2: 2 readings
    t4 = ProductTelemetry(time=base_time + timedelta(hours=1), product_id=product_a.id, voltage=200.0, power=800.0, energy=115.0)
    t5 = ProductTelemetry(time=base_time + timedelta(hours=1, minutes=30), product_id=product_a.id, voltage=210.0, power=900.0, energy=125.0)

    db.add_all([t1, t2, t3, t4, t5])
    await db.commit()

    return {
        "cust_a": customer_a,
        "cust_b": customer_b,
        "admin": admin,
        "product_a": product_a,
        "base_time": base_time,
    }


async def get_token(client: AsyncClient, email: str) -> str:
    """Helper to authenticate and retrieve access token."""
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_compute_rollups_service(analytics_setup, db: AsyncSession):
    """Verify that compute_rollups aggregates telemetry correctly into the database."""
    product_a = analytics_setup["product_a"]
    base_time = analytics_setup["base_time"]

    # Compute hourly rollups for the past 2 days
    await compute_rollups(
        db=db,
        product_id=product_a.id,
        resolution="hourly",
        start_time=base_time - timedelta(hours=1),
        end_time=base_time + timedelta(hours=5),
    )

    # Query rollups from database
    stmt = (
        select(TelemetryRollup)
        .filter(TelemetryRollup.product_id == product_a.id)
        .order_by(TelemetryRollup.bucket.asc())
    )
    result = await db.execute(stmt)
    rollups = result.scalars().all()

    assert len(rollups) == 2
    
    # First hour: avg(220, 230, 240) = 230. avg(1000, 1100, 1200) = 1100. energy max(110) - min(100) = 10
    assert rollups[0].resolution == "hourly"
    assert rollups[0].avg_voltage == 230.0
    assert rollups[0].avg_power == 1100.0
    assert rollups[0].energy_sum == 10.0

    # Second hour: avg(200, 210) = 205. avg(800, 900) = 850. energy max(125) - min(115) = 10
    assert rollups[1].avg_voltage == 205.0
    assert rollups[1].avg_power == 850.0
    assert rollups[1].energy_sum == 10.0


@pytest.mark.asyncio
async def test_historical_analytics_endpoint_and_fallback(client: AsyncClient, analytics_setup, db: AsyncSession):
    """Verify endpoint fetches history via rollups and falls back to raw aggregation when empty."""
    token_a = await get_token(client, "cust_a@example.com")
    token_b = await get_token(client, "cust_b@example.com")
    product_a = analytics_setup["product_a"]
    base_time = analytics_setup["base_time"]

    # 1. Customer B attempts to view Customer A's history -> 403 Forbidden
    res_b = await client.get(
        f"/api/v1/products/{product_a.id}/telemetry/history?resolution=hourly",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res_b.status_code == 403

    # 2. Query hourly history when rollup is empty -> Assert Dynamic Fallback computes it on the fly
    start_str = base_time.isoformat().replace("+00:00", "Z")
    end_str = (base_time + timedelta(hours=3)).isoformat().replace("+00:00", "Z")
    res_fallback = await client.get(
        f"/api/v1/products/{product_a.id}/telemetry/history?resolution=hourly"
        f"&start_time={start_str}&end_time={end_str}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    print("DEBUG 422 RESPONSE:", res_fallback.json())
    assert res_fallback.status_code == 200
    records = res_fallback.json()
    assert len(records) == 2
    assert records[0]["avg_voltage"] == 230.0
    assert records[0]["avg_power"] == 1100.0

    # 3. Compute rollups, then query hourly history -> Assert it returns pre-computed rollups directly
    await compute_rollups(
        db=db,
        product_id=product_a.id,
        resolution="hourly",
        start_time=base_time - timedelta(hours=1),
        end_time=base_time + timedelta(hours=5),
    )

    res_rollup = await client.get(
        f"/api/v1/products/{product_a.id}/telemetry/history?resolution=hourly"
        f"&start_time={start_str}&end_time={end_str}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_rollup.status_code == 200
    records_rollup = res_rollup.json()
    assert len(records_rollup) == 2
    assert records_rollup[0]["avg_voltage"] == 230.0
