"""Pydantic schemas for Lead capture."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class LeadCreate(BaseModel):
    """Payload to create a new lead inquiry."""
    name: str
    email: str
    organization: str | None = None
    message: str


class LeadRead(BaseModel):
    """Output schema representing a lead entry."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    organization: str | None
    message: str
    created_at: datetime
