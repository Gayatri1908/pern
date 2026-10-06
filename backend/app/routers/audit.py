"""Administrative Audit logs query router."""

from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies.auth import RoleChecker
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogRead

router = APIRouter()


@router.get("/", response_model=list[AuditLogRead])
async def list_audit_logs(
    admin_user_id: UUID | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    limit: int = 100,
    offset: int = 0,
    admin_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve append-only administrative audit log trail. Restricted to Admins."""
    stmt = select(AuditLog)

    # Filters
    if admin_user_id:
        stmt = stmt.filter(AuditLog.admin_user_id == admin_user_id)
    if action:
        stmt = stmt.filter(AuditLog.action == action)
    if entity_type:
        stmt = stmt.filter(AuditLog.entity_type == entity_type)

    # Pagination & sorting
    stmt = stmt.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(stmt)
    logs = result.scalars().all()
    return logs
