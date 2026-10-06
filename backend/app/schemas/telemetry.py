"""Pydantic schemas for ProductTelemetry and TelemetryRollup."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TelemetryIngest(BaseModel):
    """Schema for incoming telemetry from MQTT / ingestion worker."""
    product_id: UUID
    voltage: float | None = None
    current: float | None = None
    power: float | None = None
    energy: float | None = None
    battery_pct: float | None = None
    wind_speed: float | None = None
    rope_tension: float | None = None
    rotor_rpm: float | None = None
    comm_status: str | None = None


class TelemetryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    time: datetime
    product_id: UUID
    voltage: float | None
    current: float | None
    power: float | None
    energy: float | None
    battery_pct: float | None
    wind_speed: float | None
    rope_tension: float | None
    rotor_rpm: float | None
    comm_status: str | None


class TelemetryRollupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bucket: datetime
    product_id: UUID
    resolution: str
    avg_voltage: float | None
    avg_power: float | None
    energy_sum: float | None
