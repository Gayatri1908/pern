"""Pydantic schemas for AuditLog (read-only — no Create/Update)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    admin_user_id: UUID | None
    action: str
    entity_type: str
    entity_id: str
    ip_address: str | None
    created_at: datetime
