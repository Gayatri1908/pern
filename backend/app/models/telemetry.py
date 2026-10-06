from sqlalchemy import Column, Float, ForeignKey, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base

class ProductTelemetry(Base):
    __tablename__ = "product_telemetry"

    # Composite primary key for TimescaleDB compatibility
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True, nullable=False)

    voltage = Column(Float, nullable=True)
    current = Column(Float, nullable=True)
    power = Column(Float, nullable=True)
    energy = Column(Float, nullable=True)
    battery_pct = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    rope_tension = Column(Float, nullable=True)
    rotor_rpm = Column(Float, nullable=True)
    comm_status = Column(String, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="telemetry")

class TelemetryRollup(Base):
    __tablename__ = "telemetry_rollups"

    bucket = Column(DateTime(timezone=True), primary_key=True, nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    resolution = Column(String, primary_key=True, nullable=False) # 'hourly', 'daily', 'monthly'

    avg_voltage = Column(Float, nullable=True)
    avg_power = Column(Float, nullable=True)
    energy_sum = Column(Float, nullable=True)
    # Add other aggregated fields as necessary
