from datetime import datetime
import uuid
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_mixin
from sqlalchemy.sql import func

@declarative_mixin
class TimestampMixin:
    """Mixin to add created_at and updated_at columns."""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

@declarative_mixin
class UUIDMixin:
    """Mixin to add a UUID primary key."""
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
