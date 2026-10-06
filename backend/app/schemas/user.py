"""Pydantic schemas for User and LoginHistory."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    phone: str | None = None
    role: str = "Customer"
    company_id: UUID | None = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    password: str | None = None
    is_active: bool | None = None
    is_2fa_enabled: bool | None = None
    company_id: UUID | None = None
    approval_status: str | None = None
    verification_notes: str | None = None
    deletion_requested_at: datetime | None = None
    deletion_reason: str | None = None


from pydantic import computed_field

from app.schemas.company import CompanyRead

class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_2fa_enabled: bool
    is_active: bool
    approval_status: str = "approved"
    verification_notes: str | None = None
    approved_by_id: UUID | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    deletion_requested_at: datetime | None = None
    deletion_reason: str | None = None
    company: CompanyRead | None = None

    @computed_field
    def custom_id(self) -> str:
        return f"TSC-{str(self.id).split('-')[0].upper()}"


class LoginHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    ip_address: str | None
    device: str | None
    browser: str | None
    success: bool
    created_at: datetime
