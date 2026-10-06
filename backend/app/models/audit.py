from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDMixin

class AuditLog(Base, UUIDMixin):
    __tablename__ = "audit_logs"

    admin_user_id = Column(UUID(as_uuid=True), nullable=True) # Cannot use FK ondelete CASCADE safely if we want strict append-only
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)

    # Timestamp specific to audit log, without onupdate
    from sqlalchemy import DateTime
    from sqlalchemy.sql import func
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
