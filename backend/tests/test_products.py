"""Integration and unit tests for product registration, scoping, credentials, and thresholds."""

from __future__ import annotations

import io
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import hash_password, verify_password
from app.models.company import Company
from app.models.product import DeviceCredential, Product, RegistrationRequest, Threshold
from app.models.user import User


@pytest.fixture
async def users_setup(db: AsyncSession):
    """Seed companies, users (admin, customer1, customer2) for testing."""
    company1 = Company(name="Solar Energy Co")
    company2 = Company(name="Wind Power Ltd")
    db.add_company = company1
    db.add(company1)
    db.add(company2)
    await db.flush()

    admin = User(
        email="admin@example.com",
        password_hash=hash_password("password123"),
        role="Admin",
        is_active=True,
    )
    customer1 = User(
        email="customer1@example.com",
        password_hash=hash_password("password123"),
        role="Customer",
        company_id=company1.id,
        is_active=True,
    )
    customer2 = User(
        email="customer2@example.com",
        password_hash=hash_password("password123"),
        role="Customer",
        company_id=company2.id,
        is_active=True,
    )
    db.add_all([admin, customer1, customer2])
    await db.commit()

    return {
        "admin": admin,
        "customer1": customer1,
        "customer2": customer2,
        "company1": company1,
        "company2": company2,
    }


async def get_token_for_user(client: AsyncClient, email: str) -> str:
    """Helper to authenticate and retrieve access token."""
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_upload_invoice(client: AsyncClient, users_setup):
    """Verify customer can upload invoices locally."""
    token = await get_token_for_user(client, "customer1@example.com")
    file_content = b"PDF invoice content simulator"
    file_data = {"file": ("invoice.pdf", io.BytesIO(file_content), "application/pdf")}

    response = await client.post(
        "/api/v1/products/upload-invoice",
        headers={"Authorization": f"Bearer {token}"},
        files=file_data,
    )
    assert response.status_code == 201
    data = response.json()
    assert "invoice_url" in data
    assert data["invoice_url"].startswith("/uploads/invoice_")
    assert data["invoice_url"].endswith(".pdf")


@pytest.mark.asyncio
async def test_register_product_request(client: AsyncClient, users_setup, db: AsyncSession):
    """Verify customer can submit product registration request."""
    token = await get_token_for_user(client, "customer1@example.com")

    response = await client.post(
        "/api/v1/products/register",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "serial_number": "TURB-1001",
            "invoice_url": "/uploads/invoice_abc.pdf",
            "gps_lat": 18.5204,
            "gps_lng": 73.8567,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["serial_number"] == "TURB-1001"
    assert data["status"] == "pending"

    # Query DB to verify request exists
    result = await db.execute(select(RegistrationRequest).filter(RegistrationRequest.serial_number == "TURB-1001"))
    req = result.scalars().first()
    assert req is not None
    assert req.user_id == users_setup["customer1"].id


@pytest.mark.asyncio
async def test_register_duplicate_request(client: AsyncClient, users_setup):
    """Verify duplicate registration requests fail."""
    token = await get_token_for_user(client, "customer1@example.com")
    payload = {
        "serial_number": "TURB-COLLIDE",
        "invoice_url": "/uploads/invoice.pdf",
        "gps_lat": 18.5204,
        "gps_lng": 73.8567,
    }
    # First submit
    res1 = await client.post(
        "/api/v1/products/register",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert res1.status_code == 201

    # Duplicate submit
    res2 = await client.post(
        "/api/v1/products/register",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert res2.status_code == 400
    assert "already pending" in res2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_review_approve(client: AsyncClient, users_setup, db: AsyncSession):
    """Verify Admin approval generates Product and DeviceCredentials."""
    cust_token = await get_token_for_user(client, "customer1@example.com")
    admin_token = await get_token_for_user(client, "admin@example.com")

    # 1. Register request
    reg_res = await client.post(
        "/api/v1/products/register",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"serial_number": "TURB-APPROVED", "gps_lat": 18.5204, "gps_lng": 73.8567},
    )
    request_id = reg_res.json()["id"]

    # 2. Review and approve
    review_res = await client.post(
        f"/api/v1/products/registration-requests/{request_id}/review",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "approved", "comment": "Device looks good!"},
    )
    assert review_res.status_code == 200
    data = review_res.json()
    assert data["status"] == "approved"
    assert "raw_token" in data
    assert "product" in data
    assert data["product"]["serial_number"] == "TURB-APPROVED"
    assert data["product"]["product_code"].startswith("PRD-TURB-APPROVED")

    # Verify DB states
    prod_id = data["product"]["id"]
    result = await db.execute(select(Product).filter(Product.id == prod_id))
    product = result.scalars().first()
    assert product is not None
    assert product.owner_user_id == users_setup["customer1"].id
    assert product.status == "offline"

    cred_result = await db.execute(select(DeviceCredential).filter(DeviceCredential.product_id == prod_id))
    credential = cred_result.scalars().first()
    assert credential is not None
    assert verify_password(data["raw_token"], credential.token_hash)


@pytest.mark.asyncio
async def test_admin_review_reject(client: AsyncClient, users_setup, db: AsyncSession):
    """Verify Admin rejection updates request and does not spawn Product/Credentials."""
    cust_token = await get_token_for_user(client, "customer1@example.com")
    admin_token = await get_token_for_user(client, "admin@example.com")

    # 1. Register request
    reg_res = await client.post(
        "/api/v1/products/register",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"serial_number": "TURB-REJECTED"},
    )
    request_id = reg_res.json()["id"]

    # 2. Review and reject
    review_res = await client.post(
        f"/api/v1/products/registration-requests/{request_id}/review",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "rejected", "comment": "Invoice not clear"},
    )
    assert review_res.status_code == 200
    data = review_res.json()
    assert data["status"] == "rejected"
    assert "raw_token" not in data
    assert "product" not in data

    # Verify DB has no product or credential for this serial number
    prod_result = await db.execute(select(Product).filter(Product.serial_number == "TURB-REJECTED"))
    assert prod_result.scalars().first() is None


@pytest.mark.asyncio
async def test_row_level_scoping_products(client: AsyncClient, users_setup, db: AsyncSession):
    """Verify strict row-level scoping for product lists and detail retrievals."""
    admin_token = await get_token_for_user(client, "admin@example.com")
    c1_token = await get_token_for_user(client, "customer1@example.com")
    c2_token = await get_token_for_user(client, "customer2@example.com")

    # Create Product for Customer 1
    p1 = Product(
        product_code="PRD-C1",
        category="turbine",
        serial_number="SER-C1",
        owner_user_id=users_setup["customer1"].id,
    )
    # Create Product for Customer 2
    p2 = Product(
        product_code="PRD-C2",
        category="turbine",
        serial_number="SER-C2",
        owner_user_id=users_setup["customer2"].id,
    )
    db.add_all([p1, p2])
    await db.commit()

    # Customer 1 lists products -> only gets Product 1
    res_c1 = await client.get("/api/v1/products/", headers={"Authorization": f"Bearer {c1_token}"})
    assert res_c1.status_code == 200
    c1_products = res_c1.json()
    assert len(c1_products) == 1
    assert c1_products[0]["product_code"] == "PRD-C1"

    # Customer 2 lists products -> only gets Product 2
    res_c2 = await client.get("/api/v1/products/", headers={"Authorization": f"Bearer {c2_token}"})
    assert res_c2.status_code == 200
    c2_products = res_c2.json()
    assert len(c2_products) == 1
    assert c2_products[0]["product_code"] == "PRD-C2"

    # Admin lists products -> gets all
    res_admin = await client.get("/api/v1/products/", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    admin_products = res_admin.json()
    assert len(admin_products) == 2

    # Scoped detail access: Customer 1 accesses Product 2 -> Forbidden (403)
    res_detail_fail = await client.get(
        f"/api/v1/products/{p2.id}",
        headers={"Authorization": f"Bearer {c1_token}"},
    )
    assert res_detail_fail.status_code == 403

    # Scoped detail access: Customer 1 accesses Product 1 -> OK (200)
    res_detail_ok = await client.get(
        f"/api/v1/products/{p1.id}",
        headers={"Authorization": f"Bearer {c1_token}"},
    )
    assert res_detail_ok.status_code == 200


@pytest.mark.asyncio
async def test_credentials_rotation(client: AsyncClient, users_setup, db: AsyncSession):
    """Verify owner or admin can rotate device credentials, other users cannot."""
    c1_token = await get_token_for_user(client, "customer1@example.com")
    c2_token = await get_token_for_user(client, "customer2@example.com")

    # Create Product
    product = Product(
        product_code="PRD-ROT",
        category="turbine",
        serial_number="SER-ROT",
        owner_user_id=users_setup["customer1"].id,
    )
    db.add(product)
    await db.commit()

    # Customer 2 tries to rotate Customer 1's device credentials -> 403
    rotate_fail = await client.post(
        f"/api/v1/products/{product.id}/credentials/rotate",
        headers={"Authorization": f"Bearer {c2_token}"},
    )
    assert rotate_fail.status_code == 403

    # Customer 1 rotates credentials -> success, returns raw token
    rotate_success = await client.post(
        f"/api/v1/products/{product.id}/credentials/rotate",
        headers={"Authorization": f"Bearer {c1_token}"},
    )
    assert rotate_success.status_code == 200
    data = rotate_success.json()
    assert "raw_token" in data

    # Verify updated DB state
    result = await db.execute(select(DeviceCredential).filter(DeviceCredential.product_id == product.id))
    credential = result.scalars().first()
    assert credential is not None
    assert verify_password(data["raw_token"], credential.token_hash)


@pytest.mark.asyncio
async def test_thresholds_management(client: AsyncClient, users_setup, db: AsyncSession):
    """Verify thresholds can be configured by admin, viewed by owner, and restricted from others."""
    admin_token = await get_token_for_user(client, "admin@example.com")
    c1_token = await get_token_for_user(client, "customer1@example.com")
    c2_token = await get_token_for_user(client, "customer2@example.com")

    # Create Product
    product = Product(
        product_code="PRD-THRESH",
        category="turbine",
        serial_number="SER-THRESH",
        owner_user_id=users_setup["customer1"].id,
    )
    db.add(product)
    await db.commit()

    # 1. Customer tries to set threshold -> 403 Forbidden
    cust_set = await client.post(
        f"/api/v1/products/{product.id}/thresholds?metric_name=voltage",
        headers={"Authorization": f"Bearer {c1_token}"},
        json={"min_value": 200.0, "max_value": 250.0, "severity": "critical"},
    )
    assert cust_set.status_code == 403

    # 2. Admin sets threshold -> 200 OK
    admin_set = await client.post(
        f"/api/v1/products/{product.id}/thresholds?metric_name=voltage",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"min_value": 200.0, "max_value": 250.0, "severity": "critical"},
    )
    assert admin_set.status_code == 200
    assert admin_set.json()["metric_name"] == "voltage"
    assert admin_set.json()["min_value"] == 200.0

    # 3. Customer 1 lists thresholds -> success
    list_c1 = await client.get(
        f"/api/v1/products/{product.id}/thresholds",
        headers={"Authorization": f"Bearer {c1_token}"},
    )
    assert list_c1.status_code == 200
    assert len(list_c1.json()) == 1

    # 4. Customer 2 lists thresholds -> 403 Forbidden
    list_c2 = await client.get(
        f"/api/v1/products/{product.id}/thresholds",
        headers={"Authorization": f"Bearer {c2_token}"},
    )
    assert list_c2.status_code == 403

    # 5. Admin updates threshold -> 200 OK (voltage metric)
    admin_update = await client.post(
        f"/api/v1/products/{product.id}/thresholds?metric_name=voltage",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"min_value": 210.0, "max_value": 240.0, "severity": "warning"},
    )
    assert admin_update.status_code == 200
    assert admin_update.json()["min_value"] == 210.0
    assert admin_update.json()["severity"] == "warning"

    # 6. Admin deletes threshold -> 204 No Content
    thresh_id = admin_update.json()["id"]
    admin_delete = await client.delete(
        f"/api/v1/products/thresholds/{thresh_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_delete.status_code == 204
