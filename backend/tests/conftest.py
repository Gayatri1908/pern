"""Test configuration and common fixtures for pytest."""

from __future__ import annotations

import httpx
import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.database import get_db
from app.main import app

settings = get_settings()
settings.app_env = "testing"


@pytest.fixture
async def db_engine():
    """Create a database engine scoped to the test function to prevent event loop mismatch."""
    import app.database
    app.database.engine = None
    app.database.async_session_factory = None

    engine = create_async_engine(settings.database_url, echo=False)
    app.database.engine = engine
    
    yield engine
    
    await engine.dispose()
    app.database.engine = None
    app.database.async_session_factory = None


@pytest.fixture
async def db(db_engine) -> AsyncSession:
    """Provide a transactional database session that rolls back after each test."""
    session_factory = async_sessionmaker(
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        # Truncate tables to ensure tests start in a clean state
        # Order is important to avoid violating foreign key constraints
        await session.execute(text("TRUNCATE TABLE login_history CASCADE;"))
        await session.execute(text("TRUNCATE TABLE audit_logs CASCADE;"))
        await session.execute(text("TRUNCATE TABLE users CASCADE;"))
        await session.execute(text("TRUNCATE TABLE companies CASCADE;"))
        await session.commit()

        yield session

        # Rollback and clean up after test
        await session.rollback()


@pytest.fixture
async def client(db: AsyncSession) -> AsyncClient:
    """Provide an AsyncClient for testing API endpoints with overridden db session dependency."""

    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    # Modern httpx uses ASGITransport for testing ASGI apps
    transport = httpx.ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
async def cleanup_redis():
    """Ensure Redis client is closed and reset between tests to avoid event loop conflicts."""
    yield
    from app.utils.redis import close_redis
    await close_redis()
