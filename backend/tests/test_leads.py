"""Integration tests for public lead capture and admin indexing."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import hash_password
from app.models.lead import Lead
from app.models.user import User


@pytest.fixture
async def leads_setup(db: AsyncSession):
    """Seed users for leads access tests."""
    customer = User(
        email="customer@example.com",
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
    db.add_all([customer, admin])
    await db.commit()

    return {
        "customer": customer,
        "admin": admin,
    }


async def get_token(client: AsyncClient, email: str) -> str:
    """Helper to authenticate and retrieve access token."""
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_submit_lead_inquiry(client: AsyncClient, db: AsyncSession, caplog):
    """Verify public users can submit inquiries, storing them in DB and triggering email dispatch."""
    import logging

    payload = {
        "name": "Bruce Wayne",
        "email": "bruce@waynecorp.com",
        "organization": "Wayne Enterprises",
        "message": "Interested in deploying wind turbines for power generation.",
    }

    with caplog.at_level(logging.INFO):
        res = await client.post("/api/v1/leads/", json=payload)
        assert res.status_code == 201
        assert res.json()["name"] == "Bruce Wayne"

        # Give background task time to log
        import asyncio
        await asyncio.sleep(0.1)

        # Assert DB entry exists
        db_res = await db.execute(select(Lead).filter(Lead.email == "bruce@waynecorp.com"))
        lead = db_res.scalars().first()
        assert lead is not None
        assert lead.organization == "Wayne Enterprises"

        # Assert notification email logged to sales
        assert any("mock_email_notification_sent" in record.message for record in caplog.records)
        assert any("sales@thesource-company.com" in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_leads_list_restricted_scoping(client: AsyncClient, leads_setup):
    """Verify that only Admins can retrieve lead lists, blocking standard Customers."""
    token_cust = await get_token(client, "customer@example.com")
    token_admin = await get_token(client, "ops_admin@example.com")

    # 1. Customer receives 403 Forbidden
    res_cust = await client.get("/api/v1/leads/", headers={"Authorization": f"Bearer {token_cust}"})
    assert res_cust.status_code == 403

    # 2. Admin retrieves lead listing successfully
    res_admin = await client.get("/api/v1/leads/", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_admin.status_code == 200
    assert isinstance(res_admin.json(), list)
