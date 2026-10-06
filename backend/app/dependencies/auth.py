"""Authentication and RBAC dependencies for FastAPI routes."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import decode_token
from app.database import get_db
from app.models.user import User

# Reusable security scheme. auto_error=False allows handling missing token customly.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current authenticated user from a JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = decode_token(token)
        user_id_str: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        if user_id_str is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Query user from DB
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).filter(User.id == user_id_str).options(selectinload(User.company))
    )
    user = result.scalars().first()
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the authenticated user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )
    return current_user


class RoleChecker:
    """Enforce role-based access control (RBAC)."""

    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = [role.lower() for role in allowed_roles]

    def __call__(self, current_user: User = Depends(get_current_active_user)) -> User:
        user_role = current_user.role.lower()
        if user_role in ["super admin", "superadmin"]:
            return current_user
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )
        return current_user
