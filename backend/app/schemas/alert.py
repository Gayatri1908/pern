"""Pydantic schemas for Alert, Complaint, MaintenanceRecord."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Alert ────────────────────────────────────────────────────────────────────

class AlertBase(BaseModel):
    metric: str
    value: float
    severity: str = "warning"
    suggested_solution: str | None = None


class AlertCreate(AlertBase):
    product_id: UUID


class AlertUpdate(BaseModel):
    status: str | None = None
    assigned_engineer_id: UUID | None = None
    suggested_solution: str | None = None


class AlertRead(AlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    status: str
    assigned_engineer_id: UUID | None
    created_at: datetime
    updated_at: datetime


# ── Complaint ────────────────────────────────────────────────────────────────

class ComplaintBase(BaseModel):
    category: str
    description: str | None = None
    priority: str = "medium"
    media_urls: list[str] | None = None


class ComplaintCreate(ComplaintBase):
    product_id: UUID


class ComplaintUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None


class ComplaintRead(ComplaintBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime


# ── Maintenance Record ───────────────────────────────────────────────────────

class MaintenanceRecordBase(BaseModel):
    type: str
    scheduled_at: datetime | None = None
    parts_replaced: list[str] | None = None


class MaintenanceRecordCreate(MaintenanceRecordBase):
    product_id: UUID
    engineer_id: UUID | None = None


class MaintenanceRecordUpdate(BaseModel):
    completed_at: datetime | None = None
    parts_replaced: list[str] | None = None


class MaintenanceRecordRead(MaintenanceRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    engineer_id: UUID | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
