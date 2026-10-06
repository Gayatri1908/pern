from sqlalchemy import Column, Float, ForeignKey, Integer, String, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin

class Product(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "products"

    product_code = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=False)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    serial_number = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, nullable=False, default="offline")
    firmware_version = Column(String, nullable=True)
    install_lat = Column(Float, nullable=True)
    install_lng = Column(Float, nullable=True)

    # EV Charging Station & Battery Health fields
    station_name = Column(String, nullable=True)
    battery_health = Column(Float, nullable=False, default=95.0)
    battery_capacity_kwh = Column(Float, nullable=True, default=120.0)
    current_charge_pct = Column(Float, nullable=False, default=85.0)
    total_ports = Column(Integer, nullable=False, default=4)
    available_ports = Column(Integer, nullable=False, default=2)
    charger_type = Column(String, nullable=True, default="Fast DC (150kW)")
    battery_type = Column(String, nullable=True, default="LFP Solid-State")
    charging_price_per_kwh = Column(Float, nullable=True, default=18.5)
    rating = Column(Float, nullable=True, default=4.8)
    station_address = Column(String, nullable=True)

    # Relationships
    owner = relationship("User", back_populates="products")
    credentials = relationship("DeviceCredential", back_populates="product", cascade="all, delete-orphan", uselist=False)
    thresholds = relationship("Threshold", back_populates="product", cascade="all, delete-orphan")
    telemetry = relationship("ProductTelemetry", back_populates="product", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="product", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="product", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="product", cascade="all, delete-orphan")

class DeviceCredential(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "device_credentials"

    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), unique=True, nullable=False)
    token_hash = Column(String, nullable=False)
    rotated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    product = relationship("Product", back_populates="credentials")

class Threshold(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "thresholds"

    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    metric_name = Column(String, nullable=False)
    min_value = Column(Float, nullable=True)
    max_value = Column(Float, nullable=True)
    severity = Column(String, nullable=False, default="warning")
    notify_channels = Column(JSON, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="thresholds")

class RegistrationRequest(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "registration_requests"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    serial_number = Column(String, nullable=True) # Now optional for new request flows
    request_type = Column(String, nullable=False, default="registration") # registration, consultation, sales
    details = Column(JSON, nullable=True) # Store form details
    invoice_url = Column(String, nullable=True)
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    status = Column(String, nullable=False, default="pending")
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="registration_requests")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
