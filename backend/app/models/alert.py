from sqlalchemy import Column, Float, ForeignKey, String, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin

class Alert(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "alerts"

    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    metric = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    severity = Column(String, nullable=False, default="warning")
    status = Column(String, nullable=False, default="active")
    suggested_solution = Column(String, nullable=True)
    assigned_engineer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    product = relationship("Product", back_populates="alerts")
    assigned_engineer = relationship("User")

class Complaint(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "complaints"

    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(String, nullable=False, default="medium")
    status = Column(String, nullable=False, default="open")
    media_urls = Column(JSON, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="complaints")

class MaintenanceRecord(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "maintenance_records"

    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    engineer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    parts_replaced = Column(JSON, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="maintenance_records")
    engineer = relationship("User")
