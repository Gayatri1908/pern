"""Pydantic schemas for authentication and token handling."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.user import UserRead


class RequestVerificationRequest(BaseModel):
    email: EmailStr
    phone: str

class SignupRequest(BaseModel):
    """Schema for user and company registration with OTP verification."""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long.")
    phone: str
    email_code: str
    phone_code: str
    company_name: str | None = None
    company_gst_no: str | None = None
    company_address: str | None = None
    company_type: str | None = None


class LoginRequest(BaseModel):
    """Schema for standard email/password login."""

    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Schema returned by the login endpoint (handles 2FA redirection)."""

    requires_2fa: bool
    temp_token: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str | None = "bearer"
    user: UserRead | None = None


class Verify2FARequest(BaseModel):
    """Schema for verifying a login 2FA challenge."""

    email: EmailStr
    temp_token: str
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code.")


class RefreshRequest(BaseModel):
    """Schema for requesting rotated access/refresh tokens."""

    refresh_token: str


class TokenResponse(BaseModel):
    """Schema for a successful authentication response containing session tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class VerifyOTPRequest(BaseModel):
    """Schema for general verification of OTP (e.g. enabling 2FA)."""

    code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code.")


class ChangePasswordRequest(BaseModel):
    """Schema for authenticated user changing password."""

    current_password: str
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters long.")

