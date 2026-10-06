"""Integration tests for alerts (incidents), complaints, and notification triggers."""

from __future__ import annotations

import json
from io import BytesIO
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import hash_password
from app.models.company import Company
from app.models.product import Product
from app.models.alert import Alert, Complaint
from app.models.user import User


@pytest.fixture
async def alerts_setup(db: AsyncSession):
    """Seed data for alerts and complaints tests."""
    company = Company(name="Test Solar Systems")
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
        phone="+919876543210",
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
    engineer = User(
        email="field_eng@example.com",
        password_hash=hash_password("password123"),
        role="Customer",  # Engineers can represent customer accounts in system
        is_active=True,
    )
    db.add_all([customer_a, customer_b, admin, engineer])
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

    # Seed an Alert for Product A
    alert_a = Alert(
        product_id=product_a.id,
        metric="voltage",
        value=280.0,
        severity="critical",
        status="open",
        suggested_solution="Reduce grid power.",
    )
    db.add(alert_a)

    # Seed a Complaint for Product B
    complaint_b = Complaint(
        product_id=product_b.id,
        category="inverter",
        priority="high",
        status="new",
        media_urls=[],
    )
    db.add(complaint_b)
    await db.commit()

    return {
        "cust_a": customer_a,
        "cust_b": customer_b,
        "admin": admin,
        "engineer": engineer,
        "product_a": product_a,
        "product_b": product_b,
        "alert_a": alert_a,
        "complaint_b": complaint_b,
    }


async def get_token(client: AsyncClient, email: str) -> str:
    """Helper to authenticate and retrieve access token."""
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_alerts_list_and_scoping(client: AsyncClient, alerts_setup):
    """Verify that alerts listing is scoped based on roles (Customer vs. Admin)."""
    token_a = await get_token(client, "cust_a@example.com")
    token_b = await get_token(client, "cust_b@example.com")
    token_admin = await get_token(client, "ops_admin@example.com")

    # 1. Customer A should see only their alert (alert_a)
    res_a = await client.get("/api/v1/alerts/", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200
    assert len(res_a.json()) == 1
    assert res_a.json()[0]["product_id"] == str(alerts_setup["product_a"].id)

    # 2. Customer B has no alerts seeded on their product
    res_b = await client.get("/api/v1/alerts/", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == 200
    assert len(res_b.json()) == 0

    # 3. Admin should see all alerts (alert_a)
    res_admin = await client.get("/api/v1/alerts/", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_admin.status_code == 200
    assert len(res_admin.json()) == 1


@pytest.mark.asyncio
async def test_alert_triage_actions(client: AsyncClient, alerts_setup, db: AsyncSession):
    """Verify acknowledging, resolving, and assigning alerts works with scoped checks."""
    token_a = await get_token(client, "cust_a@example.com")
    token_b = await get_token(client, "cust_b@example.com")
    token_admin = await get_token(client, "ops_admin@example.com")
    alert_a = alerts_setup["alert_a"]
    engineer = alerts_setup["engineer"]

    # 1. Customer B tries to acknowledge Customer A's alert -> should fail (404)
    res = await client.put(f"/api/v1/alerts/{alert_a.id}/acknowledge", headers={"Authorization": f"Bearer {token_b}"})
    assert res.status_code == 404

    # 2. Customer A acknowledges their alert -> success
    res_ack = await client.put(f"/api/v1/alerts/{alert_a.id}/acknowledge", headers={"Authorization": f"Bearer {token_a}"})
    assert res_ack.status_code == 200
    assert res_ack.json()["status"] == "acknowledged"

    # 3. Customer A resolves their alert -> success
    res_res = await client.put(
        f"/api/v1/alerts/{alert_a.id}/resolve",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"suggested_solution": "Reduced grid power successfully."},
    )
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "resolved"
    assert res_res.json()["suggested_solution"] == "Reduced grid power successfully."

    # 4. Customer A tries to assign an engineer -> should fail (403 Forbidden)
    res_assign_fail = await client.put(
        f"/api/v1/alerts/{alert_a.id}/assign",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"assigned_engineer_id": str(engineer.id)},
    )
    assert res_assign_fail.status_code == 403

    # 5. Admin assigns an engineer -> success
    res_assign = await client.put(
        f"/api/v1/alerts/{alert_a.id}/assign",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"assigned_engineer_id": str(engineer.id), "suggested_solution": "Field visit scheduled."},
    )
    assert res_assign.status_code == 200
    assert res_assign.json()["status"] == "assigned"
    assert res_assign.json()["assigned_engineer_id"] == str(engineer.id)


@pytest.mark.asyncio
async def test_complaints_raising_and_listing(client: AsyncClient, alerts_setup, db: AsyncSession):
    """Verify customers can create and query support tickets/complaints with scoping."""
    token_a = await get_token(client, "cust_a@example.com")
    token_b = await get_token(client, "cust_b@example.com")
    token_admin = await get_token(client, "ops_admin@example.com")
    product_a = alerts_setup["product_a"]
    product_b = alerts_setup["product_b"]

    # 1. Customer B tries to create a ticket for Customer A's product -> 403 Forbidden
    res_create_fail = await client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"product_id": str(product_a.id), "category": "turbine", "priority": "high"},
    )
    assert res_create_fail.status_code == 403

    # 2. Customer A creates a ticket -> 201 Created
    res_create = await client.post(
        "/api/v1/complaints/",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"product_id": str(product_a.id), "category": "turbine", "priority": "high", "media_urls": ["/uploads/media/turbine.jpg"]},
    )
    assert res_create.status_code == 201
    assert res_create.json()["category"] == "turbine"
    assert res_create.json()["priority"] == "high"

    # 3. Customer A lists complaints -> sees 1 complaint
    res_list_a = await client.get("/api/v1/complaints/", headers={"Authorization": f"Bearer {token_a}"})
    assert res_list_a.status_code == 200
    assert len(res_list_a.json()) == 1

    # 4. Customer B lists complaints -> sees the seeded complaint_b
    res_list_b = await client.get("/api/v1/complaints/", headers={"Authorization": f"Bearer {token_b}"})
    assert res_list_b.status_code == 200
    assert len(res_list_b.json()) == 1

    # 5. Admin lists complaints -> sees all complaints (2)
    res_list_admin = await client.get("/api/v1/complaints/", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_list_admin.status_code == 200
    assert len(res_list_admin.json()) == 2


@pytest.mark.asyncio
async def test_complaint_admin_triage_flow(client: AsyncClient, alerts_setup, db: AsyncSession, caplog):
    """Verify that admins can triage tickets and that notification logs are triggered on updates."""
    token_a = await get_token(client, "cust_a@example.com")
    token_admin = await get_token(client, "ops_admin@example.com")
    complaint_b = alerts_setup["complaint_b"]

    # 1. Customer tries to edit ticket status -> 403 Forbidden
    res_update_fail = await client.put(
        f"/api/v1/complaints/{complaint_b.id}",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"status": "in_progress"},
    )
    assert res_update_fail.status_code == 403

    # 2. Admin updates status -> 200 OK & triggers mock notification log
    import logging
    with caplog.at_level(logging.INFO):
        res_update = await client.put(
            f"/api/v1/complaints/{complaint_b.id}",
            headers={"Authorization": f"Bearer {token_admin}"},
            json={"status": "in_progress", "priority": "critical"},
        )
        assert res_update.status_code == 200
        assert res_update.json()["status"] == "in_progress"
        assert res_update.json()["priority"] == "critical"

        # Give background tasks time to execute and log
        import asyncio
        await asyncio.sleep(0.1)

        # Verify mock notifications were logged
        assert any("mock_email_notification_sent" in record.message for record in caplog.records)
        assert any("mock_sms_notification_sent" in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_media_upload(client: AsyncClient, alerts_setup):
    """Verify uploading complaint media files functions correctly."""
    token_a = await get_token(client, "cust_a@example.com")

    # Mock file upload
    file_content = b"fake image content"
    files = {"file": ("test_turbine.jpg", BytesIO(file_content), "image/jpeg")}

    res = await client.post(
        "/api/v1/complaints/upload-media",
        headers={"Authorization": f"Bearer {token_a}"},
        files=files,
    )
    assert res.status_code == 200
    assert "url" in res.json()
    assert res.json()["url"].startswith("/uploads/media/")
