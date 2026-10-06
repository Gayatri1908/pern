"""Authentication router for all session, onboarding, and 2FA endpoints."""

from __future__ import annotations

from uuid import UUID
from pydantic import BaseModel
import structlog
import secrets
import pyotp
from app.utils.redis import get_redis
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import (
    create_access_token,
    create_refresh_token,
    create_temp_2fa_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.config import get_settings
from app.database import get_db
from app.dependencies.auth import get_current_active_user, RoleChecker
from app.models.company import Company
from app.models.user import LoginHistory, User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
    Verify2FARequest,
    VerifyOTPRequest,
    ChangePasswordRequest,
    RequestVerificationRequest,
)
from app.schemas.user import UserCreate, UserRead, UserUpdate, LoginHistoryRead
from app.services.otp import generate_otp, verify_otp
from app.services.verification import generate_signup_otps, verify_signup_otps

logger = structlog.stdlib.get_logger(__name__)

router = APIRouter()


def parse_user_agent(ua_string: str | None) -> tuple[str | None, str | None]:
    """Parse raw User-Agent header into browser and device name."""
    if not ua_string:
        return "Unknown Device", "Unknown Browser"

    browser = "Unknown Browser"
    device = "Unknown Device"

    ua_lower = ua_string.lower()
    if "chrome" in ua_lower:
        browser = "Chrome"
    elif "safari" in ua_lower:
        browser = "Safari"
    elif "firefox" in ua_lower:
        browser = "Firefox"
    elif "edge" in ua_lower:
        browser = "Edge"

    if "android" in ua_lower:
        device = "Android"
    elif "iphone" in ua_lower or "ipad" in ua_lower:
        device = "iOS Device"
    elif "windows" in ua_lower:
        device = "Windows PC"
    elif "macintosh" in ua_lower:
        device = "Mac"
    elif "linux" in ua_lower:
        device = "Linux PC"

    return device, browser


async def record_login_history(
    db: AsyncSession,
    user_id: UUID,
    ip_address: str | None,
    ua_string: str | None,
    success: bool,
) -> None:
    """Helper to write a row to the login history table."""
    device, browser = parse_user_agent(ua_string)
    history = LoginHistory(
        user_id=user_id,
        ip_address=ip_address,
        device=device,
        browser=browser,
        success=success,
    )
    db.add(history)
    await db.commit()


@router.post("/signup/request-verification")
async def request_signup_verification(payload: RequestVerificationRequest, db: AsyncSession = Depends(get_db)):
    """Generate and dispatch signup OTPs via Email and SMS."""
    # Check if email is already taken
    result = await db.execute(select(User).filter(User.email == payload.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )

    # Check if phone is already taken
    result = await db.execute(select(User).filter(User.phone == payload.phone))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered.",
        )

    # Generate and send OTPs
    await generate_signup_otps(payload.email, payload.phone)
    logger.info("signup_verification_otps_dispatched", email=payload.email)
    return {"message": "Verification codes sent via SMS and Email."}


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Public customer and company registration (OTP verified)."""
    # Verify Email & Phone Codes
    verified = await verify_signup_otps(
        payload.email, 
        payload.phone, 
        payload.email_code, 
        payload.phone_code
    )
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code for email or phone number.",
        )

    # Check if email is already taken
    result = await db.execute(select(User).filter(User.email == payload.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )

    # Check if phone is already taken
    if payload.phone:
        result = await db.execute(select(User).filter(User.phone == payload.phone))
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered.",
            )

    company_id = None
    if payload.company_name:
        # Create company first
        company = Company(
            name=payload.company_name,
            gst_no=payload.company_gst_no,
            address=payload.company_address,
            company_type=payload.company_type,
        )
        db.add(company)
        await db.flush()  # to fetch autogenerated ID
        company_id = company.id

    # Create new customer user (pending admin approval)
    user = User(
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        company_id=company_id,
        role="Customer",
        is_active=False,
        approval_status="pending",
        is_2fa_enabled=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).filter(User.id == user.id).options(selectinload(User.company))
    )
    user = result.scalars().first()

    logger.info("user_signup_submitted_for_approval", email=user.email, user_id=str(user.id))
    return user


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate email & password. Redirects to 2FA if enabled."""
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).filter(User.email == payload.email).options(selectinload(User.company))
    )
    user = result.scalars().first()

    if not user or not verify_password(payload.password, user.password_hash):
        if user:
            await record_login_history(db, user.id, ip, ua, success=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if user.approval_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been submitted for verification. Our admin team will contact you shortly for identity verification. You will receive access once your account is approved.",
        )

    if user.approval_status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account registration request was rejected by our administration team.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    if user.is_2fa_enabled:
        temp_token = create_temp_2fa_token(user.id)
        logger.info("user_login_2fa_challenge", email=user.email, user_id=str(user.id))
        return LoginResponse(requires_2fa=True, temp_token=temp_token)

    # 2FA not enabled, login immediately
    await record_login_history(db, user.id, ip, ua, success=True)
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)

    logger.info("user_login_success", email=user.email, user_id=str(user.id))
    return LoginResponse(
        requires_2fa=False,
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/verify-2fa", response_model=TokenResponse)
async def verify_2fa(
    payload: Verify2FARequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Verify login OTP and return session tokens."""
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    try:
        token_payload = decode_token(payload.temp_token)
        user_id_str = token_payload.get("sub")
        token_type = token_payload.get("type")
        if not user_id_str or token_type != "2fa_temp":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid temporary 2FA token.",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired or invalid temporary 2FA token.",
        )

    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).filter(User.id == user_id_str).options(selectinload(User.company))
    )
    user = result.scalars().first()
    if not user or user.email != payload.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA session.",
        )

    # Verify OTP
    redis = get_redis()
    secret = await redis.get(f"totp:secret:{user.id}")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA secret not found. Please re-setup 2FA.",
        )
    if isinstance(secret, bytes):
        secret = secret.decode("utf-8")

    totp = pyotp.TOTP(secret)
    is_valid = totp.verify(payload.code, valid_window=1)
    if not is_valid:
        await record_login_history(db, user.id, ip, ua, success=False)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    # Successful login
    await record_login_history(db, user.id, ip, ua, success=True)
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)

    logger.info("user_2fa_verification_success", email=user.email, user_id=str(user.id))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Rotate expired access token using a valid refresh token."""
    try:
        token_payload = decode_token(payload.refresh_token)
        user_id_str = token_payload.get("sub")
        token_type = token_payload.get("type")
        if not user_id_str or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired or invalid refresh token.",
        )

    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).filter(User.id == user_id_str).options(selectinload(User.company))
    )
    user = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or not found.",
        )

    # Generate new access and refresh tokens
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)

    logger.info("token_refresh_success", email=user.email, user_id=str(user.id))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.get("/me", response_model=UserRead)
async def get_me(
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve details of the currently logged-in user."""
    return current_user


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Allow authenticated user to change their password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password.",
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    logger.info("user_password_changed", email=current_user.email, user_id=str(current_user.id))
    return {"message": "Password changed successfully."}


@router.post("/logout")
async def logout():
    """Sign out client session (client-side discard)."""
    return {"message": "Logged out successfully."}


@router.post("/2fa/request-enable")
async def request_enable_2fa(
    current_user: User = Depends(get_current_active_user),
):
    """Initiate 2FA setup by generating a TOTP secret and provisioning URI."""
    if current_user.is_2fa_enabled:
        return {"message": "Two-Factor Authentication is already enabled."}

    secret = pyotp.random_base32()
    redis = get_redis()
    # Save temporary secret in Redis for 10 minutes
    await redis.setex(f"totp:temp_secret:{current_user.id}", 600, secret)

    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="The Source Company"
    )
    
    logger.info("user_2fa_enable_request", email=current_user.email)
    return {
        "secret": secret,
        "provisioning_uri": provisioning_uri,
        "qr_code_url": f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={provisioning_uri}"
    }


@router.post("/2fa/confirm-enable")
async def confirm_enable_2fa(
    payload: VerifyOTPRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirm and activate 2FA after verifying the TOTP code."""
    if current_user.is_2fa_enabled:
        return {"message": "Two-Factor Authentication is already enabled."}

    redis = get_redis()
    temp_secret = await redis.get(f"totp:temp_secret:{current_user.id}")
    if not temp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup session expired. Please request verification again.",
        )
    
    if isinstance(temp_secret, bytes):
        temp_secret = temp_secret.decode("utf-8")

    totp = pyotp.TOTP(temp_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    # Save secret persistently in Redis
    await redis.set(f"totp:secret:{current_user.id}", temp_secret)
    await redis.delete(f"totp:temp_secret:{current_user.id}")

    current_user.is_2fa_enabled = True
    db.add(current_user)
    await db.commit()

    logger.info("user_2fa_enabled", email=current_user.email)
    return {"message": "Two-Factor Authentication enabled successfully."}


@router.post("/2fa/disable")
async def disable_2fa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Disable Two-Factor Authentication."""
    if not current_user.is_2fa_enabled:
        return {"message": "Two-Factor Authentication is already disabled."}

    redis = get_redis()
    await redis.delete(f"totp:secret:{current_user.id}")

    current_user.is_2fa_enabled = False
    db.add(current_user)
    await db.commit()

    logger.info("user_2fa_disabled", email=current_user.email)
    return {"message": "Two-Factor Authentication disabled successfully."}


# ── Google OAuth Stubs / Development Mocks ───────────────────────────────


@router.get("/google")
async def google_login():
    """Mock/stub Google OAuth redirect."""
    settings = get_settings()
    if not settings.google_client_id:
        return {
            "message": "Google OAuth is not configured. Use /api/v1/auth/google/mock in development."
        }
    # In production, redirect to Google authorization page
    return RedirectResponse(
        url=f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.google_client_id}&redirect_uri={settings.google_redirect_uri}&response_type=code&scope=openid%20email"
    )


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Mock/stub Google OAuth callback."""
    # In production: exchange code for Google token, read email, find/create user, return session tokens.
    logger.info("google_oauth_callback_received", code=code)
    return {"message": "Callback received. Stubbed endpoint."}


@router.post("/google/mock", response_model=TokenResponse)
async def google_mock_login(
    email: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Development mock login for Google OAuth (always creates user if not exists)."""
    settings = get_settings()
    if not settings.is_dev:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mock Google Login is only available in development.",
        )

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()

    if not user:
        # Create a mock customer user
        user = User(
            email=email,
            password_hash=hash_password(secrets.token_urlsafe(16)),
            role="Customer",
            is_active=True,
            is_2fa_enabled=False,
            google_id=f"google-mock-{secrets.token_hex(8)}",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("google_mock_user_created", email=email, user_id=str(user.id))

    await record_login_history(db, user.id, ip, ua, success=True)
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)

    # Load company relationship
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).filter(User.id == user.id).options(selectinload(User.company))
    )
    user = result.scalars().first()

    logger.info("google_mock_login_success", email=email, user_id=str(user.id))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


# ── User Administration (Admin only) ─────────────────────────────────────────

@router.get("/users", response_model=list[UserRead])
async def list_users(
    search: str | None = None,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """List all registered users, support multi-field search by any detail (Admin only)."""
    from sqlalchemy.orm import selectinload
    from sqlalchemy import or_, String, cast

    stmt = select(User).options(selectinload(User.company))
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.join(User.company, isouter=True).filter(
            or_(
                User.email.ilike(term),
                User.phone.ilike(term),
                User.role.ilike(term),
                User.approval_status.ilike(term),
                Company.name.ilike(term),
                cast(User.id, String).ilike(term),
            )
        )
    stmt = stmt.order_by(User.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/users/pending", response_model=list[UserRead])
async def list_pending_users(
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """List all pending registration verification requests (Admin only)."""
    from sqlalchemy.orm import selectinload
    stmt = select(User).filter(User.approval_status == "pending").options(selectinload(User.company)).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


class ApproveUserRequest(BaseModel):
    notes: str | None = None

class RejectUserRequest(BaseModel):
    notes: str | None = None

@router.post("/users/{user_id}/approve", response_model=UserRead)
async def approve_user_registration(
    user_id: UUID,
    payload: ApproveUserRequest | None = None,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Approve a pending user registration (Admin only)."""
    from sqlalchemy.sql import func
    from sqlalchemy.orm import selectinload

    result = await db.execute(select(User).filter(User.id == user_id).options(selectinload(User.company)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.approval_status = "approved"
    user.is_active = True
    user.approved_by_id = current_user.id
    user.reviewed_at = func.now()
    if payload and payload.notes:
        user.verification_notes = payload.notes

    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info("user_registration_approved", user_id=str(user.id), admin_id=str(current_user.id))
    return user


@router.post("/users/{user_id}/reject", response_model=UserRead)
async def reject_user_registration(
    user_id: UUID,
    payload: RejectUserRequest | None = None,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Reject a pending user registration (Admin only)."""
    from sqlalchemy.sql import func
    from sqlalchemy.orm import selectinload

    result = await db.execute(select(User).filter(User.id == user_id).options(selectinload(User.company)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.approval_status = "rejected"
    user.is_active = False
    user.approved_by_id = current_user.id
    user.reviewed_at = func.now()
    if payload and payload.notes:
        user.verification_notes = payload.notes

    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info("user_registration_rejected", user_id=str(user.id), admin_id=str(current_user.id))
    return user


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user_details(
    user_id: UUID,
    payload: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's details or toggle active status."""
    if current_user.role != "Admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update other users' details.",
        )

    # Prevent non-admins from updating restricted administrative fields
    if current_user.role != "Admin":
        update_data = payload.model_dump(exclude_unset=True)
        if "is_active" in update_data or "company_id" in update_data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non-admin users cannot modify active state or company assignment.",
            )

    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).filter(User.id == user_id).options(selectinload(User.company))
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    update_dict = payload.model_dump(exclude_unset=True)

    # Prevent users from deactivating their own account
    if current_user.id == user_id and update_dict.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot deactivate your own account.",
        )

    # Protect Super Admin account
    if user.role.lower() in ["super admin", "superadmin"]:
        if update_dict.get("is_active") is False or update_dict.get("approval_status") == "rejected" or (update_dict.get("role") and update_dict.get("role").lower() not in ["super admin", "superadmin"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super Admin account cannot be deactivated, rejected, or downgraded.",
            )

    if "password" in update_dict:
        raw_pwd = update_dict.pop("password")
        if raw_pwd:
            user.password_hash = hash_password(raw_pwd)

    for field, value in update_dict.items():
        setattr(user, field, value)

    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info("user_updated", target_user_id=str(user_id), actor_id=str(current_user.id))
    return user


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    payload: UserCreate,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user account (Admin only)."""
    result = await db.execute(select(User).filter(User.email == payload.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )
        
    if payload.phone:
        result = await db.execute(select(User).filter(User.phone == payload.phone))
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered.",
            )

    user = User(
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
        company_id=payload.company_id,
        is_active=True,
        is_2fa_enabled=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).filter(User.id == user.id).options(selectinload(User.company))
    )
    user = result.scalars().first()
    
    logger.info("user_created_by_admin", email=user.email, user_id=str(user.id), admin_id=str(current_user.id))
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user account with role-scoped authorization."""
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # 1. Super Admin protection
    if user.role.lower() in ["super admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin account cannot be deleted or removed.",
        )

    actor_role = current_user.role.lower()
    target_role = user.role.lower()

    # 2. Super Admin can ONLY remove Admins
    if actor_role in ["super admin", "superadmin"]:
        if target_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super Admin can only remove Admin accounts.",
            )

    # 3. Regular Admin can ONLY remove Customers
    if actor_role == "admin":
        if target_role in ["admin", "super admin", "superadmin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin accounts cannot remove other Admins or Super Admins.",
            )

    await db.delete(user)
    await db.commit()

    logger.info("user_deleted", target_user_id=str(user_id), actor_id=str(current_user.id))
    return None


@router.get("/users/{user_id}/login-history", response_model=list[LoginHistoryRead])
async def get_user_login_history(
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List login session logs for a specific user (Admin or current user)."""
    if current_user.role != "Admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other users' session logs.",
        )
    stmt = select(LoginHistory).filter(LoginHistory.user_id == user_id).order_by(LoginHistory.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


from pydantic import BaseModel, EmailStr
from app.models.company import Company

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

class GoogleLoginRequest(BaseModel):
    email: EmailStr
    google_id: str
    role: str = "Customer"

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Simulate forgot password token generation."""
    result = await db.execute(select(User).filter(User.email == payload.email))
    user = result.scalars().first()
    if not user:
        return {"message": "If the email exists, a reset token has been generated."}
    
    redis = get_redis()
    token = f"RESET-{secrets.token_hex(3).upper()}"
    await redis.set(f"reset:token:{payload.email}", token, ex=900)
    logger.info("password_reset_requested", email=payload.email, token=token)
    return {"message": "Password reset code generated.", "debug_token": token}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Verify reset token and update password."""
    redis = get_redis()
    saved_token = await redis.get(f"reset:token:{payload.email}")
    if isinstance(saved_token, bytes):
        saved_token = saved_token.decode("utf-8")
        
    if not saved_token or saved_token != payload.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )
        
    result = await db.execute(select(User).filter(User.email == payload.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    await db.commit()
    await redis.delete(f"reset:token:{payload.email}")
    logger.info("password_reset_success", email=payload.email)
    return {"message": "Password updated successfully."}


class GoogleVerifyRequest(BaseModel):
    credential: str
    role: str = "Customer"


@router.post("/google-login", response_model=LoginResponse)
async def google_login(
    payload: GoogleVerifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Verify real Google OAuth ID token with Google servers and authenticate user."""
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    token = payload.credential.strip()

    email = None
    google_sub = None

    # Verify ID Token directly with Google's tokeninfo API endpoint
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}")
            if resp.status_code == 200:
                google_data = resp.json()
                email = google_data.get("email")
                google_sub = google_data.get("sub")
    except Exception as e:
        logger.error("google_token_verify_error", error=str(e))

    if not email or not google_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google OAuth token."
        )

    result = await db.execute(select(User).filter(or_(User.email == email, User.google_id == google_sub)))
    user = result.scalars().first()

    if not user:
        comp_res = await db.execute(select(Company).limit(1))
        company = comp_res.scalars().first()
        if not company:
            company = Company(name="General Customer Corp", gst_no="27AAAAA1111A1Z1", address="Industrial Zone")
            db.add(company)
            await db.commit()
            await db.refresh(company)

        user = User(
            email=email,
            password_hash=hash_password(secrets.token_hex(16)),
            google_id=google_sub,
            role=payload.role if payload.role in ["Customer", "Admin"] else "Customer",
            approval_status="approved",
            is_active=True,
            company_id=company.id,
            is_2fa_enabled=False
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("google_real_signup_success", email=email, user_id=str(user.id))
    else:
        if not user.google_id:
            user.google_id = google_sub
            db.add(user)
            await db.commit()

    await record_login_history(db, user.id, ip, ua, success=True)
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)

    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).filter(User.id == user.id).options(selectinload(User.company))
    )
    user = result.scalars().first()

    logger.info("google_real_login_success", email=user.email, user_id=str(user.id))
    return LoginResponse(
        requires_2fa=False,
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


from pydantic import BaseModel
from sqlalchemy.sql import func

class DeactivateProfileRequest(BaseModel):
    reason: str

@router.post("/users/me/deactivate", response_model=UserRead)
async def deactivate_profile(
    payload: DeactivateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Initiate deactivation and scheduled permanent deletion of current user profile (after 30 days)."""
    current_user.deletion_requested_at = func.now()
    current_user.deletion_reason = payload.reason
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    logger.info("user_initiated_profile_deletion", user_id=str(current_user.id), reason=payload.reason)
    return current_user

@router.post("/users/me/cancel-deactivation", response_model=UserRead)
async def cancel_profile_deactivation(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel scheduled profile deletion for the current user."""
    current_user.deletion_requested_at = None
    current_user.deletion_reason = None
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    logger.info("user_cancelled_profile_deletion", user_id=str(current_user.id))
    return current_user


class ProfileOTPRequest(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None

class ProfileOTPVerify(BaseModel):
    otp: str
    email: EmailStr | None = None
    phone: str | None = None

@router.post("/profile/request-otp")
async def request_profile_update_otp(
    payload: ProfileOTPRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Generate and dispatch OTP for profile email/phone updates."""
    target_identifier = payload.email or payload.phone or current_user.email
    await generate_otp(target_identifier)
    logger.info("profile_update_otp_sent", user_id=str(current_user.id), target=target_identifier)
    return {
        "message": f"Verification OTP sent to {target_identifier}",
        "target": target_identifier,
        "expires_in": 300
    }

@router.post("/profile/verify-otp", response_model=UserRead)
async def verify_profile_update_otp(
    payload: ProfileOTPVerify,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify OTP code and update user profile email or phone."""
    target_identifier = payload.email or payload.phone or current_user.email
    is_valid = await verify_otp(target_identifier, payload.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification OTP code.",
        )

    if payload.email:
        current_user.email = payload.email
    if payload.phone:
        current_user.phone = payload.phone

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    logger.info("profile_updated_with_otp", user_id=str(current_user.id), email=current_user.email, phone=current_user.phone)
    return current_user


