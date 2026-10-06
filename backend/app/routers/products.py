"""Products and Device Registration router."""

from __future__ import annotations

import os
import secrets
import shutil
from uuid import UUID
import structlog
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import text, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import hash_password
from app.config import get_settings
from app.database import get_db
from app.dependencies.auth import RoleChecker, get_current_active_user
from app.models.product import DeviceCredential, Product, RegistrationRequest, Threshold
from app.models.user import User
from app.schemas.product import (
    DeviceCredentialRotated,
    ProductCreate,
    ProductRead,
    ProductUpdate,
    RegistrationRequestCreate,
    RegistrationRequestRead,
    RegistrationRequestReview,
    ThresholdCreate,
    ThresholdRead,
    ThresholdUpdate,
    ProductCreateResponse,
)

logger = structlog.stdlib.get_logger(__name__)

router = APIRouter()


import json

CATALOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "catalog.json")

@router.get("/catalog")
async def get_catalog():
    """Retrieve list of catalog products."""
    if not os.path.exists(CATALOG_FILE):
        return []
    with open(CATALOG_FILE, "r") as f:
        return json.load(f)


from fastapi import Body

@router.put("/catalog")
async def update_catalog(
    payload: list = Body(...),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    """Update list of catalog products (Admin only)."""
    with open(CATALOG_FILE, "w") as f:
        json.dump(payload, f, indent=2)
    logger.info("catalog_updated", admin_id=str(current_user.id))
    return {"message": "Catalog updated successfully.", "catalog": payload}


import uuid
@router.post("/catalog/upload-image")
async def upload_catalog_image(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    """Upload product catalog image (Admin only)."""
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "catalog")
    os.makedirs(static_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1]
    if ext.lower() not in [".png", ".jpg", ".jpeg", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Invalid image file format.")
        
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(static_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://localhost:8000/static/catalog/{filename}"}


@router.post("/upload-invoice", status_code=status.HTTP_201_CREATED)
async def upload_invoice(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Upload an invoice file to local storage (simulating S3)."""
    settings = get_settings()
    os.makedirs(settings.upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_name = f"invoice_{secrets.token_hex(16)}{file_ext}"
    file_path = os.path.join(settings.upload_dir, unique_name)

    # Save to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    invoice_url = f"/uploads/{unique_name}"
    logger.info("invoice_uploaded", email=current_user.email, invoice_url=invoice_url)
    return {"invoice_url": invoice_url}


@router.post("/register", response_model=RegistrationRequestRead, status_code=status.HTTP_201_CREATED)
async def register_product(
    payload: RegistrationRequestCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a registration request to link a device to the user's account."""
    # Check if device is already registered
    result = await db.execute(select(Product).filter(Product.serial_number == payload.serial_number))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this serial number is already registered.",
        )

    # Check if there is already a pending registration request for this serial number
    result = await db.execute(
        select(RegistrationRequest).filter(
            RegistrationRequest.serial_number == payload.serial_number,
            RegistrationRequest.status == "pending",
        )
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A registration request for this serial number is already pending.",
        )

    request_row = RegistrationRequest(
        user_id=current_user.id,
        serial_number=payload.serial_number,
        request_type=payload.request_type,
        details=payload.details,
        invoice_url=payload.invoice_url,
        gps_lat=payload.gps_lat,
        gps_lng=payload.gps_lng,
        status="pending",
    )
    db.add(request_row)
    await db.commit()
    await db.refresh(request_row)

    logger.info(
        "product_registration_request_submitted",
        user_id=str(current_user.id),
        serial_number=payload.serial_number,
        request_id=str(request_row.id),
    )
    return request_row


@router.get("/registration-requests", response_model=list[RegistrationRequestRead])
async def list_registration_requests(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List registration requests (Customers see their own; Admins see all)."""
    if current_user.role.lower() == "admin":
        stmt = select(RegistrationRequest).order_by(RegistrationRequest.created_at.desc())
    else:
        stmt = (
            select(RegistrationRequest)
            .filter(RegistrationRequest.user_id == current_user.id)
            .order_by(RegistrationRequest.created_at.desc())
        )

    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/registration-requests/{request_id}/review")
async def review_registration_request(
    request_id: UUID,
    payload: RegistrationRequestReview,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Review a pending registration request. Approvals auto-generate the Product and MQTT Token."""
    result = await db.execute(select(RegistrationRequest).filter(RegistrationRequest.id == request_id))
    req = result.scalars().first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration request not found.",
        )

    if req.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration request has already been reviewed.",
        )

    req.status = payload.status.lower()
    req.reviewed_by_id = current_user.id

    raw_token = None
    product_data = None

    if req.status == "approved" and req.request_type == "registration":
        serial_num = req.serial_number
        if not serial_num:
            serial_num = f"SN-GEN-{secrets.token_hex(4).upper()}"
            req.serial_number = serial_num

        # Check if product with this serial number already exists (e.g. pre-created by Admin)
        existing_check = await db.execute(select(Product).filter(Product.serial_number == serial_num))
        product = existing_check.scalars().first()

        if product:
            product.owner_user_id = req.user_id
            if req.gps_lat is not None:
                product.install_lat = req.gps_lat
            if req.gps_lng is not None:
                product.install_lng = req.gps_lng
            db.add(product)
            await db.flush()

            # Retrieve existing credential token if available or generate new
            cred_res = await db.execute(select(DeviceCredential).filter(DeviceCredential.product_id == product.id))
            credential = cred_res.scalars().first()
            if not credential:
                raw_token = f"tok_{secrets.token_urlsafe(32)}"
                credential = DeviceCredential(
                    product_id=product.id,
                    token_hash=hash_password(raw_token),
                )
                db.add(credential)
            else:
                raw_token = "PRE-EXISTING-CREDENTIALS"
        else:
            # Generate product code and product
            product_code = f"PRD-{serial_num}"
            # Ensure product code is unique (append suffix if collision)
            dup_check = await db.execute(select(Product).filter(Product.product_code == product_code))
            if dup_check.scalars().first():
                product_code = f"PRD-{serial_num}-{secrets.token_hex(4)}"

            product = Product(
                product_code=product_code,
                category="turbine",  # Default category
                owner_user_id=req.user_id,
                serial_number=serial_num,
                status="offline",
                install_lat=req.gps_lat,
                install_lng=req.gps_lng,
            )
            db.add(product)
            await db.flush()  # Populate product.id

            # Generate credentials
            raw_token = f"tok_{secrets.token_urlsafe(32)}"
            credential = DeviceCredential(
                product_id=product.id,
                token_hash=hash_password(raw_token),
            )
            db.add(credential)

        product_data = {
            "id": str(product.id),
            "product_code": product.product_code,
            "category": product.category,
            "serial_number": product.serial_number,
            "status": product.status,
            "install_lat": product.install_lat,
            "install_lng": product.install_lng,
            "owner_user_id": str(product.owner_user_id),
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None,
        }

    db.add(req)
    await db.commit()

    logger.info(
        "product_registration_request_reviewed",
        request_id=str(request_id),
        status=req.status,
        reviewer_id=str(current_user.id),
    )

    response = {
        "status": req.status,
        "reviewed_by_id": str(req.reviewed_by_id),
        "comment": payload.comment,
    }
    if raw_token:
        response["raw_token"] = raw_token
        response["mqtt_credential_token"] = raw_token
        response["product"] = product_data

    return response


@router.post("/", response_model=ProductCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Create a new product directly (Admin only) and auto-generate credentials."""
    # Check if serial number already registered
    result = await db.execute(select(Product).filter(Product.serial_number == payload.serial_number))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this serial number is already registered.",
        )

    # Check if product code already registered
    code_result = await db.execute(select(Product).filter(Product.product_code == payload.product_code))
    if code_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this product code is already registered.",
        )

    product = Product(
        product_code=payload.product_code,
        category=payload.category,
        serial_number=payload.serial_number,
        status=payload.status or "offline",
        firmware_version=payload.firmware_version,
        install_lat=payload.install_lat,
        install_lng=payload.install_lng,
        owner_user_id=payload.owner_user_id,
        station_name=payload.station_name,
        battery_health=payload.battery_health if payload.battery_health is not None else 95.0,
        battery_capacity_kwh=payload.battery_capacity_kwh,
        current_charge_pct=payload.current_charge_pct if payload.current_charge_pct is not None else 85.0,
        total_ports=payload.total_ports if payload.total_ports is not None else 4,
        available_ports=payload.available_ports if payload.available_ports is not None else 2,
        charger_type=payload.charger_type,
        battery_type=payload.battery_type,
        charging_price_per_kwh=payload.charging_price_per_kwh,
        rating=payload.rating,
        station_address=payload.station_address,
    )
    db.add(product)
    await db.flush()  # Populate product.id

    # Auto generate credentials on direct creation
    raw_token = f"tok_{secrets.token_urlsafe(32)}"
    credential = DeviceCredential(
        product_id=product.id,
        token_hash=hash_password(raw_token),
    )
    db.add(credential)

    await db.commit()
    await db.refresh(product)

    logger.info(
        "product_created_directly",
        product_id=str(product.id),
        product_code=product.product_code,
        admin_id=str(current_user.id),
    )
    
    return ProductCreateResponse(
        product=ProductRead.model_validate(product),
        mqtt_credential_token=raw_token,
    )

from app.models.telemetry import ProductTelemetry

@router.get("/my-products")
async def get_my_products(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed assigned products for the customer's dashboard."""
    stmt = select(Product).filter(Product.owner_user_id == current_user.id).order_by(Product.created_at.desc())
    result = await db.execute(stmt)
    products = result.scalars().all()

    my_products = []
    for p in products:
        tel_stmt = select(ProductTelemetry).filter(ProductTelemetry.product_id == p.id).order_by(ProductTelemetry.time.desc()).limit(1)
        tel_result = await db.execute(tel_stmt)
        latest_tel = tel_result.scalars().first()

        energy_today = 0
        health = 98.5
        efficiency = 92.4
        power_output = 0
        last_sync = "Never"
        battery = 100
        signal = "Excellent"

        if latest_tel:
            energy_today = (latest_tel.energy % 100) if latest_tel.energy else 42.1
            power_output = latest_tel.power if latest_tel.power else 12.4
            battery = latest_tel.battery_pct if latest_tel.battery_pct else 98
            last_sync = "Just now"
            health = round(max(0, min(100, 100 - (abs(latest_tel.voltage - 240) if latest_tel.voltage else 0))), 1)

        my_products.append({
            "id": str(p.id),
            "productName": f"{p.category.replace('_', ' ').title()} Turbine",
            "image": "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "serialNumber": p.serial_number,
            "firmware": p.firmware_version or "v2.1.4",
            "installDate": p.created_at.strftime("%b %d, %Y"),
            "location": f"{round(p.install_lat, 2)}, {round(p.install_lng, 2)}" if p.install_lat else "Unknown",
            "status": p.status,
            "health": health,
            "energyToday": energy_today,
            "efficiency": efficiency,
            "powerOutput": power_output,
            "lastSync": last_sync,
            "batteryPct": battery,
            "signalStrength": signal,
        })
    return my_products


@router.get("/public/ev-stations", response_model=list[ProductRead])
async def list_public_ev_stations(
    db: AsyncSession = Depends(get_db),
):
    """Unauthenticated public endpoint returning all active EV charging and battery stations for the public website."""
    stmt = (
        select(Product)
        .filter(
            or_(
                Product.category == "ev_charging_hub",
                Product.category == "battery_storage_station",
                Product.station_name.isnot(None),
            )
        )
        .order_by(Product.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/", response_model=list[ProductRead])
async def list_products(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List products (Customers see their own owned products + available unowned products)."""
    if current_user.role.lower() in ["admin", "super admin"]:
        stmt = select(Product).order_by(Product.created_at.desc())
    else:
        stmt = (
            select(Product)
            .filter(Product.owner_user_id == current_user.id)
            .order_by(Product.created_at.desc())
        )

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details of a specific product (enforces owner scoping for Customers)."""
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    # Customers can only view their own products
    if current_user.role.lower() != "admin" and product.owner_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this product.",
        )

    return product


@router.put("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Update a product (Admin only)."""
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.add(product)
    await db.commit()
    await db.refresh(product)

    logger.info("product_updated_by_admin", product_id=str(product_id), admin_id=str(current_user.id))
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Delete a product (Admin only)."""
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    await db.delete(product)
    await db.commit()

    logger.info("product_deleted_by_admin", product_id=str(product_id), admin_id=str(current_user.id))
    return None


@router.post("/{product_id}/credentials/rotate", response_model=DeviceCredentialRotated)
async def rotate_device_credentials(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Rotate the device credential token (Admin or owner customer only)."""
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    # Scoping check
    if current_user.role.lower() != "admin" and product.owner_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to rotate this device's credentials.",
        )

    # Find or create device credentials row
    cred_result = await db.execute(select(DeviceCredential).filter(DeviceCredential.product_id == product_id))
    credential = cred_result.scalars().first()

    raw_token = f"tok_{secrets.token_urlsafe(32)}"
    from datetime import datetime, timezone

    if not credential:
        credential = DeviceCredential(
            product_id=product_id,
            token_hash=hash_password(raw_token),
            rotated_at=datetime.now(timezone.utc),
        )
    else:
        credential.token_hash = hash_password(raw_token)
        credential.rotated_at = datetime.now(timezone.utc)

    db.add(credential)
    await db.commit()
    await db.refresh(credential)

    logger.info(
        "device_credentials_rotated",
        product_id=str(product_id),
        actor_id=str(current_user.id),
    )

    return DeviceCredentialRotated(
        id=credential.id,
        product_id=credential.product_id,
        rotated_at=credential.rotated_at,
        created_at=credential.created_at,
        updated_at=credential.updated_at,
        raw_token=raw_token,
        mqtt_credential_token=raw_token,
    )


# ── Threshold Configuration ──────────────────────────────────────────────────


@router.get("/{product_id}/thresholds", response_model=list[ThresholdRead])
async def list_thresholds(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List threshold configurations for a product (Customer owner or Admin only)."""
    # Scoping Check
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
            detail="You do not have permission to view thresholds for this product.",
        )

    thresh_result = await db.execute(select(Threshold).filter(Threshold.product_id == product_id))
    return thresh_result.scalars().all()


@router.post("/{product_id}/thresholds", response_model=ThresholdRead)
async def upsert_threshold(
    product_id: UUID,
    payload: ThresholdUpdate,  # Takes metric name and value bounds
    metric_name: str,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Upsert (Create/Update) a threshold configuration for a metric (Admin only)."""
    # Verify product exists
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    # Check if threshold already exists for this product and metric
    thresh_result = await db.execute(
        select(Threshold).filter(Threshold.product_id == product_id, Threshold.metric_name == metric_name)
    )
    threshold = thresh_result.scalars().first()

    if threshold:
        # Update
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(threshold, field, value)
    else:
        # Create
        threshold = Threshold(
            product_id=product_id,
            metric_name=metric_name,
            min_value=payload.min_value,
            max_value=payload.max_value,
            severity=payload.severity or "warning",
            notify_channels=payload.notify_channels,
        )

    db.add(threshold)
    await db.commit()
    await db.refresh(threshold)

    logger.info(
        "threshold_upserted",
        product_id=str(product_id),
        metric=metric_name,
        admin_id=str(current_user.id),
    )
    return threshold


@router.delete("/thresholds/{threshold_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_threshold(
    threshold_id: UUID,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Delete a threshold configuration (Admin only)."""
    result = await db.execute(select(Threshold).filter(Threshold.id == threshold_id))
    threshold = result.scalars().first()
    if not threshold:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Threshold not found.",
        )

    await db.delete(threshold)
    await db.commit()

    logger.info("threshold_deleted", threshold_id=str(threshold_id), admin_id=str(current_user.id))
    return None

