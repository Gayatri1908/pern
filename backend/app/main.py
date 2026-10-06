"""The Source Company — FastAPI Application Factory."""

from __future__ import annotations

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.logging_config import setup_logging
from app.routers.auth import router as auth_router
from app.routers.products import router as products_router
from app.routers.telemetry import router as telemetry_router
from app.routers.alerts import router as alerts_router
from app.routers.complaints import router as complaints_router
from app.routers.audit import router as audit_router
from app.routers.reports import router as reports_router
from app.routers.leads import router as leads_router
from app.routers.maintenance import router as maintenance_router
from app.routers.analytics import router as analytics_router
from app.routers.weather import router as weather_router
from app.services.mqtt_worker import run_worker

logger = structlog.stdlib.get_logger(__name__)


async def auto_delete_users_worker():
    """Background task to delete users who requested deletion > 30 days ago."""
    from app.database import get_session_factory
    from app.models.user import User
    from sqlalchemy.future import select
    from datetime import datetime, timezone, timedelta
    import asyncio
    
    logger.info("auto_delete_worker_started")
    while True:
        try:
            session_factory = get_session_factory()
            async with session_factory() as db:
                thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
                result = await db.execute(
                    select(User).filter(
                        User.deletion_requested_at != None,
                        User.deletion_requested_at <= thirty_days_ago
                    )
                )
                users_to_delete = result.scalars().all()
                for user in users_to_delete:
                    logger.info("system_auto_deleting_user", user_id=str(user.id), email=user.email)
                    await db.delete(user)
                if users_to_delete:
                    await db.commit()
        except Exception as e:
            logger.error("auto_delete_worker_error", error=str(e))
        
        # Sleep for 1 hour
        await asyncio.sleep(3600)


async def ensure_superadmin_exists():
    """Ensure a Super Admin user exists in the database on startup."""
    from app.database import get_session_factory
    from app.models.user import User
    from app.auth.security import hash_password
    from sqlalchemy.future import select
    from sqlalchemy import or_

    session_factory = get_session_factory()
    try:
        async with session_factory() as db:
            target_email = "thesource.companyweb@gmail.com"
            new_hash = hash_password("TheSourceTon@2004")

            res = await db.execute(
                select(User).filter(
                    or_(
                        User.email == target_email,
                        User.email == "superadmin@thesource-company.in",
                        User.role == "Super Admin"
                    )
                )
            )
            sa = res.scalars().first()
            if not sa:
                sa = User(
                    email=target_email,
                    phone="9999999999",
                    role="Super Admin",
                    password_hash=new_hash,
                    approval_status="approved",
                    is_active=True,
                )
                db.add(sa)
                await db.commit()
                logger.info("superadmin_created", email=sa.email)
            else:
                sa.email = target_email
                sa.role = "Super Admin"
                sa.password_hash = new_hash
                sa.approval_status = "approved"
                sa.is_active = True
                await db.commit()
                logger.info("superadmin_credentials_updated", email=sa.email)
    except Exception as e:
        logger.error("ensure_superadmin_exists_failed", error=str(e))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle for the application."""
    import asyncio
    settings = get_settings()
    logger.info(
        "application_starting",
        app_name=settings.app_name,
        env=settings.app_env,
        debug=settings.debug,
    )

    # Seed Super Admin user
    await ensure_superadmin_exists()

    # Start MQTT ingestion worker if not in testing mode
    worker_task = None
    if settings.app_env != "testing":
        worker_task = asyncio.create_task(run_worker())

    # Start auto-deletion worker
    delete_worker_task = asyncio.create_task(auto_delete_users_worker())

    yield

    if worker_task:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass

    if delete_worker_task:
        delete_worker_task.cancel()
        try:
            await delete_worker_task
        except asyncio.CancelledError:
            pass

    logger.info("application_shutting_down")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()

    # Configure structured logging before anything else
    setup_logging(log_level=settings.log_level)

    app = FastAPI(
        title=settings.app_name,
        description="Industrial IoT Renewable Energy Management Platform API",
        version="0.1.0",
        docs_url="/docs" if settings.is_dev else None,
        redoc_url="/redoc" if settings.is_dev else None,
        lifespan=lifespan,
    )

    # ── CORS ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Health check ──
    @app.get("/healthz", tags=["health"])
    async def healthz():
        """Health check endpoint."""
        return {"status": "ok"}

    # ── API routers ──
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(products_router, prefix="/api/v1/products", tags=["products"])
    app.include_router(telemetry_router, prefix="/api/v1/products", tags=["telemetry"])
    app.include_router(maintenance_router, prefix="/api/v1/products", tags=["maintenance"])
    app.include_router(alerts_router, prefix="/api/v1/alerts", tags=["alerts"])
    app.include_router(complaints_router, prefix="/api/v1/complaints", tags=["complaints"])
    app.include_router(audit_router, prefix="/api/v1/audit", tags=["audit"])
    app.include_router(reports_router, prefix="/api/v1/reports", tags=["reports"])
    app.include_router(leads_router, prefix="/api/v1/leads", tags=["leads"])
    app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])
    app.include_router(weather_router, tags=["weather"])

    from fastapi.staticfiles import StaticFiles
    import os
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    os.makedirs(static_dir, exist_ok=True)
    os.makedirs(os.path.join(static_dir, "catalog"), exist_ok=True)
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

    logger.info("application_created", cors_origins=settings.api_cors_origins)
    return app


# Module-level app instance for uvicorn
app = create_app()
