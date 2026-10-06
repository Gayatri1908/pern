"""Pydantic schemas for Company."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CompanyBase(BaseModel):
    name: str
    gst_no: str | None = None
    address: str | None = None
    company_type: str | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = None
    gst_no: str | None = None
    address: str | None = None
    company_type: str | None = None


class CompanyRead(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
