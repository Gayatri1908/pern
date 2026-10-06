from sqlalchemy import Boolean, Column, ForeignKey, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin

class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    role = Column(String, nullable=False, default="Customer")
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    google_id = Column(String, unique=True, index=True, nullable=True)
    is_2fa_enabled = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    approval_status = Column(String, nullable=False, default="approved") # "pending", "approved", "rejected"
    verification_notes = Column(String, nullable=True)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    deletion_requested_at = Column(DateTime(timezone=True), nullable=True)
    deletion_reason = Column(String, nullable=True)

    # Relationships
    company = relationship("Company", back_populates="users")
    approved_by = relationship("User", remote_side="User.id", foreign_keys=[approved_by_id])
    login_history = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="owner")
    registration_requests = relationship("RegistrationRequest", back_populates="user", foreign_keys="RegistrationRequest.user_id", cascade="all, delete-orphan")

class LoginHistory(Base, UUIDMixin):
    __tablename__ = "login_history"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(String, nullable=True)
    device = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    success = Column(Boolean, nullable=False, default=True)

    # Timestamp specific to login history
    from sqlalchemy import DateTime
    from sqlalchemy.sql import func
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="login_history")
