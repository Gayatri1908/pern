"""Pydantic schemas for Product, Threshold, RegistrationRequest, DeviceCredential."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Product ──────────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    product_code: str
    category: str
    serial_number: str
    status: str = "offline"
    firmware_version: str | None = None
    install_lat: float | None = None
    install_lng: float | None = None
    station_name: str | None = None
    battery_health: float = 95.0
    battery_capacity_kwh: float | None = 120.0
    current_charge_pct: float = 85.0
    total_ports: int = 4
    available_ports: int = 2
    charger_type: str | None = "Fast DC (150kW)"
    battery_type: str | None = "LFP Solid-State"
    charging_price_per_kwh: float | None = 18.5
    rating: float | None = 4.8
    station_address: str | None = None


class ProductCreate(ProductBase):
    owner_user_id: UUID | None = None


class ProductUpdate(BaseModel):
    category: str | None = None
    status: str | None = None
    firmware_version: str | None = None
    install_lat: float | None = None
    install_lng: float | None = None
    owner_user_id: UUID | None = None
    station_name: str | None = None
    battery_health: float | None = None
    battery_capacity_kwh: float | None = None
    current_charge_pct: float | None = None
    total_ports: int | None = None
    available_ports: int | None = None
    charger_type: str | None = None
    battery_type: str | None = None
    charging_price_per_kwh: float | None = None
    rating: float | None = None
    station_address: str | None = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_user_id: UUID | None
    created_at: datetime
    updated_at: datetime


# ── Threshold ────────────────────────────────────────────────────────────────

class ThresholdBase(BaseModel):
    metric_name: str
    min_value: float | None = None
    max_value: float | None = None
    severity: str = "warning"
    notify_channels: list[str] | None = None


class ThresholdCreate(ThresholdBase):
    product_id: UUID


class ThresholdUpdate(BaseModel):
    min_value: float | None = None
    max_value: float | None = None
    severity: str | None = None
    notify_channels: list[str] | None = None


class ThresholdRead(ThresholdBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    created_at: datetime
    updated_at: datetime


# ── Registration Request ─────────────────────────────────────────────────────

class RegistrationRequestBase(BaseModel):
    serial_number: str | None = None
    request_type: str = "registration"
    details: dict | None = None
    invoice_url: str | None = None
    gps_lat: float | None = None
    gps_lng: float | None = None


class RegistrationRequestCreate(RegistrationRequestBase):
    pass


class RegistrationRequestRead(RegistrationRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    status: str
    reviewed_by_id: UUID | None
    created_at: datetime
    updated_at: datetime


class RegistrationRequestReview(BaseModel):
    status: str  # "approved" or "rejected"
    comment: str | None = None


# ── Device Credentials ────────────────────────────────────────────────────────


class DeviceCredentialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    rotated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class DeviceCredentialRotated(DeviceCredentialRead):
    raw_token: str
    mqtt_credential_token: str


class ProductCreateResponse(BaseModel):
    product: ProductRead
    mqtt_credential_token: str

