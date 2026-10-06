"""Complaints (support tickets) management router."""

from __future__ import annotations

import os
from uuid import UUID, uuid4
import structlog
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config import get_settings
from app.database import get_db
from app.dependencies.auth import get_current_active_user, RoleChecker
from app.models.alert import Complaint
from app.models.product import Product
from app.models.user import User
from app.schemas.alert import ComplaintCreate, ComplaintRead, ComplaintUpdate

logger = structlog.stdlib.get_logger(__name__)
settings = get_settings()

router = APIRouter()

ALLOWED_MEDIA_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".avi"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


@router.post("/", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Raise a support ticket / complaint. Customers can only raise complaints for products they own."""
    # Validate product ownership
    result = await db.execute(select(Product).filter(Product.id == payload.product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    if current_user.role.lower() != "admin" and product.owner_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only raise complaints for products you own.",
        )

    complaint = Complaint(
        product_id=payload.product_id,
        category=payload.category,
        description=payload.description,
        priority=payload.priority,
        status="open",
        media_urls=payload.media_urls,
    )
    db.add(complaint)
    await db.commit()
    await db.refresh(complaint)

    logger.info("complaint_created", complaint_id=str(complaint.id), user_id=str(current_user.id))
    return complaint


@router.post("/upload-media")
async def upload_complaint_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Upload photos or videos for support tickets. Saves locally to uploads/media/."""
    # 1. Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_MEDIA_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported formats: {', '.join(ALLOWED_MEDIA_EXTENSIONS)}",
        )

    # 2. Check file size
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is too large. Max size is 50MB.",
        )

    # 3. Securely save file
    media_dir = os.path.join(settings.upload_dir, "media")
    os.makedirs(media_dir, exist_ok=True)

    filename = f"{uuid4()}{ext}"
    filepath = os.path.join(media_dir, filename)

    try:
        with open(filepath, "wb") as f:
            f.write(await file.read())
    except Exception as e:
        logger.error("media_upload_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file.",
        )

    url_path = f"/uploads/media/{filename}"
    logger.info("media_uploaded", filepath=filepath, url=url_path, user_id=str(current_user.id))
    return {"url": url_path}


@router.get("/", response_model=list[ComplaintRead])
async def list_complaints(
    status_filter: str | None = None,
    priority_filter: str | None = None,
    product_id: UUID | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List complaints. Scoped: Customers see only complaints related to their own products."""
    stmt = select(Complaint).join(Product, Complaint.product_id == Product.id)

    # Scoping
    if current_user.role.lower() != "admin":
        stmt = stmt.filter(Product.owner_user_id == current_user.id)

    # Filters
    if status_filter:
        stmt = stmt.filter(Complaint.status == status_filter)
    if priority_filter:
        stmt = stmt.filter(Complaint.priority == priority_filter)
    if product_id:
        stmt = stmt.filter(Complaint.product_id == product_id)

    stmt = stmt.order_by(Complaint.created_at.desc())
    result = await db.execute(stmt)
    complaints = result.scalars().all()
    return complaints


@router.get("/{id}", response_model=ComplaintRead)
async def get_complaint(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve complaint details. Scoped: Customers see only complaints related to their own products."""
    stmt = select(Complaint).join(Product, Complaint.product_id == Product.id).filter(Complaint.id == id)
    if current_user.role.lower() != "admin":
        stmt = stmt.filter(Product.owner_user_id == current_user.id)

    result = await db.execute(stmt)
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found or access denied.",
        )
    return complaint


@router.patch("/{id}", response_model=ComplaintRead)
async def update_complaint(
    id: UUID,
    payload: ComplaintUpdate,
    admin_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Update complaint status or priority. Restricted to Admin."""
    result = await db.execute(select(Complaint).filter(Complaint.id == id))
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )

    old_status = complaint.status
    if payload.status:
        complaint.status = payload.status
    if payload.priority:
        complaint.priority = payload.priority

    await db.commit()
    await db.refresh(complaint)

    # Trigger notifications on status change
    if payload.status and old_status != payload.status:
        # Fetch product owner details
        prod_stmt = select(Product).filter(Product.id == complaint.product_id)
        prod_res = await db.execute(prod_stmt)
        product = prod_res.scalars().first()
        if product and product.owner_user_id:
            user_res = await db.execute(select(User).filter(User.id == product.owner_user_id))
            owner = user_res.scalars().first()
            if owner:
                import asyncio
                from app.services.notifications import send_email_notification, send_sms_notification
                msg = f"Your complaint status for product {product.product_code} has been updated to {payload.status}."
                asyncio.create_task(
                    send_email_notification(
                        recipient=owner.email,
                        subject=f"Update: Complaint #{complaint.id} status is now {payload.status}",
                        body=msg,
                    )
                )
                if owner.phone:
                    asyncio.create_task(
                        send_sms_notification(
                            phone_number=owner.phone,
                            message=msg,
                        )
                    )

    logger.info("complaint_updated", complaint_id=str(complaint.id), status=complaint.status)
    return complaint
