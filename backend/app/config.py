"""The Source Company — Application Settings.

All configuration is read from environment variables via pydantic-settings.
See .env.example for the full list of available settings.
"""

from __future__ import annotations

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──
    app_name: str = "TheSourceCompany"
    app_env: str = "development"
    debug: bool = True
    log_level: str = "DEBUG"

    # ── API ──
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    @field_validator("api_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # ── Database ──
    database_url: str = "postgresql+asyncpg://thesource:thesource_dev@localhost:5432/thesource_dev"
    database_url_sync: str = "postgresql+psycopg2://thesource:thesource_dev@localhost:5432/thesource_dev"

    # ── Redis ──
    redis_url: str = "redis://localhost:6379/0"

    # ── MQTT ──
    mqtt_broker_host: str = "localhost"
    mqtt_broker_port: int = 1883

    # ── Auth / JWT ──
    jwt_secret_key: str = "CHANGE_ME_IN_PRODUCTION_use_openssl_rand_hex_32"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # ── Google OAuth ──
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"

    # ── External Services ──
    twilio_enabled: bool = False
    ses_enabled: bool = False
    s3_enabled: bool = False
    weather_api_enabled: bool = False

    # ── Twilio / SMTP OTP configs ──
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_from_phone: str = ""
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""

    # ── File Storage ──
    upload_dir: str = "./uploads"

    @property
    def twilio_from_number(self) -> str:
        return self.twilio_phone_number or self.twilio_from_phone

    @property
    def is_dev(self) -> bool:
        return self.app_env == "development"


# Singleton settings instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """Return the cached settings singleton."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
