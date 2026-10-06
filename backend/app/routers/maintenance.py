"""Maintenance records router for scheduling and tracking device service."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID
import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies.auth import get_current_active_user, RoleChecker
from app.models.alert import MaintenanceRecord
from app.models.product import Product
from app.models.user import User
from app.schemas.alert import MaintenanceRecordCreate, MaintenanceRecordRead, MaintenanceRecordUpdate

logger = structlog.stdlib.get_logger(__name__)

router = APIRouter()


@router.get("/{product_id}/maintenance", response_model=list[MaintenanceRecordRead])
async def list_maintenance(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all maintenance records for a product. Scoped by ownership."""
    # Ownership check
    prod_res = await db.execute(select(Product).filter(Product.id == product_id))
    product = prod_res.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    if current_user.role.lower() != "admin" and product.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    stmt = (
        select(MaintenanceRecord)
        .filter(MaintenanceRecord.product_id == product_id)
        .order_by(MaintenanceRecord.scheduled_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/{product_id}/maintenance", response_model=MaintenanceRecordRead, status_code=status.HTTP_201_CREATED)
async def create_maintenance(
    product_id: UUID,
    payload: MaintenanceRecordCreate,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Schedule a new maintenance record (Admin only)."""
    prod_res = await db.execute(select(Product).filter(Product.id == product_id))
    product = prod_res.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    record = MaintenanceRecord(
        product_id=product_id,
        type=payload.type,
        engineer_id=payload.engineer_id,
        scheduled_at=payload.scheduled_at,
        parts_replaced=payload.parts_replaced,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    logger.info("maintenance_scheduled", product_id=str(product_id), admin_id=str(current_user.id))
    return record


@router.put("/maintenance/{record_id}", response_model=MaintenanceRecordRead)
async def complete_maintenance(
    record_id: UUID,
    payload: MaintenanceRecordUpdate,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Mark a maintenance record as completed (Admin only)."""
    result = await db.execute(select(MaintenanceRecord).filter(MaintenanceRecord.id == record_id))
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found.")

    record.completed_at = payload.completed_at or datetime.utcnow()
    if payload.parts_replaced:
        record.parts_replaced = payload.parts_replaced

    await db.commit()
    await db.refresh(record)

    logger.info("maintenance_completed", record_id=str(record_id), admin_id=str(current_user.id))
    return record
