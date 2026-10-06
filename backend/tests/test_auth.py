"""Integration and unit tests for authentication and authorization (RBAC)."""

from __future__ import annotations

import pytest
from fastapi import Depends
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import hash_password
from app.dependencies.auth import RoleChecker
from app.main import app
from app.models.audit import AuditLog
from app.models.company import Company
from app.models.user import LoginHistory, User
from app.utils.redis import get_redis


# Define a temporary test router or endpoint on the app for testing RBAC
@app.get("/test-admin-route")
async def test_admin_route(current_user: User = Depends(RoleChecker(["Admin"]))):
    return {"message": "Admin authorized"}


@app.get("/test-customer-route")
async def test_customer_route(current_user: User = Depends(RoleChecker(["Customer"]))):
    return {"message": "Customer authorized"}


@pytest.mark.asyncio
async def test_signup_with_company(client: AsyncClient, db: AsyncSession):
    """Verify signup creates both company and user with Customer role."""
    # Seed OTP codes in Redis
    redis = get_redis()
    await redis.set("signup:otp:email:test_customer@example.com", "123456")
    await redis.set("signup:otp:phone:9876543210", "123456")

    response = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": "test_customer@example.com",
            "password": "strongpassword123",
            "phone": "9876543210",
            "email_code": "123456",
            "phone_code": "123456",
            "company_name": "Test Energy Corp",
            "company_gst_no": "27AAAAA1111A1Z1",
            "company_address": "123 Solar Street, Pune",
            "company_type": "Industry",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test_customer@example.com"
    assert data["role"] == "Customer"
    assert data["company_id"] is not None

    # Check Database
    result = await db.execute(select(User).filter(User.email == "test_customer@example.com"))
    user = result.scalars().first()
    assert user is not None
    assert user.phone == "9876543210"
    assert user.company_id is not None

    # Check Company
    result = await db.execute(select(Company).filter(Company.id == user.company_id))
    company = result.scalars().first()
    assert company is not None
    assert company.name == "Test Energy Corp"
    assert company.company_type == "Industry"


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient):
    """Verify signup prevents duplicate emails."""
    redis = get_redis()
    await redis.set("signup:otp:email:duplicate@example.com", "123456")
    await redis.set("signup:otp:phone:9876543210", "123456")

    payload = {
        "email": "duplicate@example.com",
        "password": "strongpassword123",
        "phone": "9876543210",
        "email_code": "123456",
        "phone_code": "123456",
        "company_name": "Duplicate Inc",
    }
    response1 = await client.post("/api/v1/auth/signup", json=payload)
    assert response1.status_code == 201

    # Re-seed OTP codes in Redis since they were deleted after successful signup
    await redis.set("signup:otp:email:duplicate@example.com", "123456")
    await redis.set("signup:otp:phone:9876543210", "123456")

    response2 = await client.post("/api/v1/auth/signup", json=payload)
    assert response2.status_code == 400
    assert "already registered" in response2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success_no_2fa(client: AsyncClient, db: AsyncSession):
    """Verify login success when 2FA is disabled, returning tokens and saving history."""
    # Create user directly in DB
    user = User(
        email="login_no_2fa@example.com",
        password_hash=hash_password("correctpassword"),
        role="Customer",
        is_active=True,
        is_2fa_enabled=False,
    )
    db.add(user)
    await db.commit()

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login_no_2fa@example.com", "password": "correctpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["requires_2fa"] is False
    assert data["access_token"] is not None
    assert data["refresh_token"] is not None
    assert data["user"]["email"] == "login_no_2fa@example.com"

    # Verify login history
    result = await db.execute(select(LoginHistory).filter(LoginHistory.user_id == user.id))
    history = result.scalars().all()
    assert len(history) == 1
    assert history[0].success is True


@pytest.mark.asyncio
async def test_login_incorrect_password(client: AsyncClient, db: AsyncSession):
    """Verify login fails with wrong password and logs failure in history."""
    user = User(
        email="login_fail@example.com",
        password_hash=hash_password("correctpassword"),
        role="Customer",
        is_active=True,
    )
    db.add(user)
    await db.commit()

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login_fail@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401

    # Verify login history logged a failure
    result = await db.execute(select(LoginHistory).filter(LoginHistory.user_id == user.id))
    history = result.scalars().all()
    assert len(history) == 1
    assert history[0].success is False


@pytest.mark.asyncio
async def test_login_flow_with_2fa(client: AsyncClient, db: AsyncSession):
    """Verify full 2FA challenge flow: login -> temp token -> OTP -> full tokens."""
    # Create user with 2FA enabled
    user = User(
        email="login_2fa@example.com",
        password_hash=hash_password("correctpassword"),
        role="Customer",
        is_active=True,
        is_2fa_enabled=True,
    )
    db.add(user)
    await db.commit()

    # Step 1: Login triggers 2FA
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login_2fa@example.com", "password": "correctpassword"},
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["requires_2fa"] is True
    temp_token = login_data["temp_token"]
    assert temp_token is not None

    # Retrieve OTP directly from Redis for testing
    redis = get_redis()
    otp_code = await redis.get(f"otp:val:{user.email}")
    assert otp_code is not None
    assert len(otp_code) == 6

    # Step 2: Verify with incorrect OTP first (should fail)
    verify_fail = await client.post(
        "/api/v1/auth/verify-2fa",
        json={
            "email": "login_2fa@example.com",
            "temp_token": temp_token,
            "code": "000000",
        },
    )
    assert verify_fail.status_code == 400

    # Step 3: Verify with correct OTP
    verify_success = await client.post(
        "/api/v1/auth/verify-2fa",
        json={
            "email": "login_2fa@example.com",
            "temp_token": temp_token,
            "code": otp_code,
        },
    )
    assert verify_success.status_code == 200
    token_data = verify_success.json()
    assert token_data["access_token"] is not None
    assert token_data["refresh_token"] is not None
    assert token_data["user"]["email"] == "login_2fa@example.com"

    # Verify login history records success
    result = await db.execute(
        select(LoginHistory).filter(LoginHistory.user_id == user.id, LoginHistory.success == True)
    )
    assert result.scalars().first() is not None


@pytest.mark.asyncio
async def test_2fa_otp_attempts_lockout(client: AsyncClient, db: AsyncSession):
    """Verify that OTP is invalidated and deleted after 3 failed attempts."""
    user = User(
        email="lockout_2fa@example.com",
        password_hash=hash_password("correctpassword"),
        role="Customer",
        is_active=True,
        is_2fa_enabled=True,
    )
    db.add(user)
    await db.commit()

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "lockout_2fa@example.com", "password": "correctpassword"},
    )
    temp_token = login_response.json()["temp_token"]

    redis = get_redis()
    val_key = f"otp:val:{user.email}"
    assert await redis.get(val_key) is not None

    # 3 Failed verification attempts
    for _ in range(3):
        res = await client.post(
            "/api/v1/auth/verify-2fa",
            json={
                "email": "lockout_2fa@example.com",
                "temp_token": temp_token,
                "code": "000000",
            },
        )
        assert res.status_code == 400

    # OTP should now be deleted from Redis
    assert await redis.get(val_key) is None


@pytest.mark.asyncio
async def test_token_refresh(client: AsyncClient, db: AsyncSession):
    """Verify refresh token rotation returns new access/refresh tokens."""
    user = User(
        email="refresh@example.com",
        password_hash=hash_password("password"),
        role="Customer",
        is_active=True,
    )
    db.add(user)
    await db.commit()

    # Login to get refresh token
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "refresh@example.com", "password": "password"},
    )
    refresh_token = login_res.json()["refresh_token"]

    # Refresh tokens
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert data["access_token"] is not None
    assert data["refresh_token"] is not None


@pytest.mark.asyncio
async def test_rbac_endpoint_access(client: AsyncClient, db: AsyncSession):
    """Verify RoleChecker blocks incorrect roles and allows correct ones."""
    admin_user = User(
        email="admin@example.com",
        password_hash=hash_password("password"),
        role="Admin",
        is_active=True,
    )
    customer_user = User(
        email="customer@example.com",
        password_hash=hash_password("password"),
        role="Customer",
        is_active=True,
    )
    db.add(admin_user)
    db.add(customer_user)
    await db.commit()

    # Get tokens
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "password"},
    )
    admin_token = admin_login.json()["access_token"]

    customer_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer@example.com", "password": "password"},
    )
    customer_token = customer_login.json()["access_token"]

    # Admin accesses Admin route -> Success
    res = await client.get(
        "/test-admin-route",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200

    # Customer accesses Admin route -> Forbidden (403)
    res = await client.get(
        "/test-admin-route",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 403

    # Customer accesses Customer route -> Success
    res = await client.get(
        "/test-customer-route",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_audit_logs_append_only_trigger(db: AsyncSession):
    """Verify database-level trigger prevents UPDATE or DELETE on audit_logs."""
    # Insert an audit log
    audit = AuditLog(
        action="TEST_ACTION",
        entity_type="TEST_ENTITY",
        entity_id="test-id-123",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(audit)

    # Attempt to UPDATE
    audit.action = "MALICIOUS_UPDATE"
    db.add(audit)
    with pytest.raises(DBAPIError) as exc_info:
        await db.commit()
    assert "Audit logs are append-only" in str(exc_info.value)
    await db.rollback()

    # Attempt to DELETE
    with pytest.raises(DBAPIError) as exc_info:
        await db.execute(text("DELETE FROM audit_logs WHERE entity_id = 'test-id-123';"))
        await db.commit()
    assert "Audit logs are append-only" in str(exc_info.value)
    await db.rollback()
