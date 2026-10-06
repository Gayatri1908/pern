"""Alerts (Incidents) management router."""

from __future__ import annotations

from uuid import UUID
import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies.auth import get_current_active_user, RoleChecker
from app.models.alert import Alert
from app.models.product import Product
from app.models.user import User
from app.schemas.alert import AlertRead, AlertUpdate

logger = structlog.stdlib.get_logger(__name__)

router = APIRouter()


@router.get("/", response_model=list[AlertRead])
async def list_alerts(
    status_filter: str | None = None,
    severity_filter: str | None = None,
    product_id: UUID | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List alerts. Scoped: Customers see alerts only for their own products."""
    stmt = select(Alert).join(Product, Alert.product_id == Product.id)

    # Scoping
    if current_user.role.lower() != "admin":
        stmt = stmt.filter(Product.owner_user_id == current_user.id)

    # Filters
    if status_filter:
        stmt = stmt.filter(Alert.status == status_filter)
    if severity_filter:
        stmt = stmt.filter(Alert.severity == severity_filter)
    if product_id:
        stmt = stmt.filter(Alert.product_id == product_id)

    stmt = stmt.order_by(Alert.created_at.desc())
    result = await db.execute(stmt)
    alerts = result.scalars().all()
    return alerts


@router.get("/{id}", response_model=AlertRead)
async def get_alert(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve an alert. Scoped: Customers see alerts only for their own products."""
    stmt = select(Alert).join(Product, Alert.product_id == Product.id).filter(Alert.id == id)
    if current_user.role.lower() != "admin":
        stmt = stmt.filter(Product.owner_user_id == current_user.id)

    result = await db.execute(stmt)
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found or access denied.",
        )
    return alert


@router.put("/{id}/acknowledge", response_model=AlertRead)
async def acknowledge_alert(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Acknowledge an alert. Open to Admin and owning Customer."""
    stmt = select(Alert).join(Product, Alert.product_id == Product.id).filter(Alert.id == id)
    if current_user.role.lower() != "admin":
        stmt = stmt.filter(Product.owner_user_id == current_user.id)

    result = await db.execute(stmt)
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found or access denied.",
        )

    alert.status = "acknowledged"
    await db.commit()
    await db.refresh(alert)

    logger.info("alert_acknowledged", alert_id=str(alert.id), user_id=str(current_user.id))
    return alert


@router.put("/{id}/resolve", response_model=AlertRead)
async def resolve_alert(
    id: UUID,
    update_data: AlertUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Resolve an alert. Open to Admin and owning Customer."""
    stmt = select(Alert).join(Product, Alert.product_id == Product.id).filter(Alert.id == id)
    if current_user.role.lower() != "admin":
        stmt = stmt.filter(Product.owner_user_id == current_user.id)

    result = await db.execute(stmt)
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found or access denied.",
        )

    alert.status = "resolved"
    if update_data.suggested_solution:
        alert.suggested_solution = update_data.suggested_solution

    await db.commit()
    await db.refresh(alert)

    logger.info("alert_resolved", alert_id=str(alert.id), user_id=str(current_user.id))
    return alert


@router.put("/{id}/assign", response_model=AlertRead)
async def assign_alert(
    id: UUID,
    update_data: AlertUpdate,
    admin_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Assign an engineer to an alert/incident. Restricted to Admin."""
    result = await db.execute(select(Alert).filter(Alert.id == id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found.",
        )

    if update_data.assigned_engineer_id:
        # Validate engineer user exists
        user_res = await db.execute(select(User).filter(User.id == update_data.assigned_engineer_id))
        engineer = user_res.scalars().first()
        if not engineer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned engineer user not found.",
            )
        alert.assigned_engineer_id = update_data.assigned_engineer_id
        alert.status = "assigned"

    if update_data.suggested_solution:
        alert.suggested_solution = update_data.suggested_solution

    await db.commit()
    await db.refresh(alert)

    logger.info(
        "alert_assigned",
        alert_id=str(alert.id),
        engineer_id=str(alert.assigned_engineer_id) if alert.assigned_engineer_id else None,
    )
    return alert
