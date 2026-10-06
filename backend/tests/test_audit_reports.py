"""Integration tests for administrative audit logs querying and scoped CSV data reports."""

from __future__ import annotations

import csv
import io
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import hash_password
from app.models.company import Company
from app.models.product import Product
from app.models.alert import Alert, Complaint
from app.models.audit import AuditLog
from app.models.telemetry import TelemetryRollup
from app.models.user import User


@pytest.fixture
async def reports_setup(db: AsyncSession):
    """Seed data for audit logging and reports tests."""
    company = Company(name="Test Wind Energy Corp")
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
    product_b = Product(
        product_code="PRD-BBB-200",
        category="battery",
        serial_number="SER-BBB-200",
        owner_user_id=customer_b.id,
        status="offline",
    )
    db.add_all([product_a, product_b])
    await db.flush()

    # Seed an AuditLog entry
    audit = AuditLog(
        admin_user_id=admin.id,
        action="approve_registration",
        entity_type="product",
        entity_id=str(product_a.id),
        ip_address="127.0.0.1",
    )
    db.add(audit)

    # Seed TelemetryRollup for Product A
    base_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    rollup = TelemetryRollup(
        bucket=base_time - timedelta(hours=2),
        product_id=product_a.id,
        resolution="hourly",
        avg_voltage=230.5,
        avg_power=1150.0,
        energy_sum=12.5,
    )
    db.add(rollup)

    # Seed Alert for Product A
    alert = Alert(
        product_id=product_a.id,
        metric="voltage",
        value=280.0,
        severity="critical",
        status="open",
        suggested_solution="Reduce grid power.",
    )
    db.add(alert)

    # Seed Complaint for Product A
    complaint = Complaint(
        product_id=product_a.id,
        category="generator",
        priority="high",
        status="new",
        media_urls=[],
    )
    db.add(complaint)

    await db.commit()

    return {
        "cust_a": customer_a,
        "cust_b": customer_b,
        "admin": admin,
        "product_a": product_a,
        "product_b": product_b,
        "audit": audit,
        "rollup": rollup,
        "alert": alert,
        "complaint": complaint,
    }


async def get_token(client: AsyncClient, email: str) -> str:
    """Helper to authenticate and retrieve access token."""
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_audit_logs_query_scoping(client: AsyncClient, reports_setup):
    """Verify that only Admins can query administrative audit logs."""
    token_a = await get_token(client, "cust_a@example.com")
    token_admin = await get_token(client, "ops_admin@example.com")

    # 1. Customer tries to query audit logs -> 403 Forbidden
    res_a = await client.get("/api/v1/audit/", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 403

    # 2. Admin queries audit logs -> Success and returns seeded log
    res_admin = await client.get("/api/v1/audit/", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_admin.status_code == 200
    logs = res_admin.json()
    assert len(logs) == 1
    assert logs[0]["action"] == "approve_registration"


@pytest.mark.asyncio
async def test_reports_energy_csv_streaming(client: AsyncClient, reports_setup):
    """Verify that energy rollup data exports as a scoped CSV stream."""
    token_a = await get_token(client, "cust_a@example.com")
    token_b = await get_token(client, "cust_b@example.com")
    product_a = reports_setup["product_a"]
    product_b = reports_setup["product_b"]

    # 1. Customer B tries to request report on Customer A's product -> 403 Forbidden
    res_fail = await client.get(
        f"/api/v1/reports/energy?product_id={product_a.id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res_fail.status_code == 403

    # 2. Customer A requests report on their own product -> streams scoped CSV
    res_ok = await client.get(
        f"/api/v1/reports/energy?product_id={product_a.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_ok.status_code == 200
    assert res_ok.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment" in res_ok.headers["content-disposition"]

    # Parse CSV contents
    content = res_ok.text
    csv_file = io.StringIO(content)
    reader = csv.reader(csv_file)
    rows = list(reader)

    # Assert headers and matching row values
    assert rows[0] == ["Bucket", "Product ID", "Resolution", "Avg Voltage", "Avg Power", "Energy Sum"]
    assert len(rows) == 2  # Header + 1 record
    assert rows[1][1] == str(product_a.id)
    assert float(rows[1][3]) == 230.5


@pytest.mark.asyncio
async def test_reports_failures_and_complaints_streaming(client: AsyncClient, reports_setup):
    """Verify that failures and complaints data exports correctly stream scoped CSV rows."""
    token_a = await get_token(client, "cust_a@example.com")
    token_b = await get_token(client, "cust_b@example.com")
    token_admin = await get_token(client, "ops_admin@example.com")
    product_a = reports_setup["product_a"]

    # ── Failures (Alerts) Report Scoping ──
    # Customer A should see 1 alert
    res_a = await client.get("/api/v1/reports/failures", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200
    assert len(list(csv.reader(io.StringIO(res_a.text)))) == 2  # Header + 1 row

    # Customer B should see 0 alerts (only header row)
    res_b = await client.get("/api/v1/reports/failures", headers={"Authorization": f"Bearer {token_b}"})
    assert len(list(csv.reader(io.StringIO(res_b.text)))) == 1  # Header only

    # Admin should see all alerts (1)
    res_admin = await client.get("/api/v1/reports/failures", headers={"Authorization": f"Bearer {token_admin}"})
    assert len(list(csv.reader(io.StringIO(res_admin.text)))) == 2

    # ── Complaints Report Scoping ──
    # Customer A should see 1 complaint
    res_complaint_a = await client.get("/api/v1/reports/complaints", headers={"Authorization": f"Bearer {token_a}"})
    assert res_complaint_a.status_code == 200
    rows_c = list(csv.reader(io.StringIO(res_complaint_a.text)))
    assert rows_c[0] == ["Complaint ID", "Product ID", "Category", "Priority", "Status", "Media URLs Count", "Created At"]
    assert len(rows_c) == 2
    assert rows_c[1][1] == str(product_a.id)
    assert rows_c[1][2] == "generator"
