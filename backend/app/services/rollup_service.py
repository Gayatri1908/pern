"""Service for computing and updating time-range telemetry rollups."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from app.models.telemetry import ProductTelemetry, TelemetryRollup


async def compute_rollups(
    db: AsyncSession,
    product_id: UUID,
    resolution: str,
    start_time: datetime,
    end_time: datetime,
) -> None:
    """Aggregate raw telemetry and upsert into the telemetry_rollups table."""
    db_res_map = {
        "hourly": "hour",
        "daily": "day",
        "monthly": "month",
    }
    trunc_val = db_res_map.get(resolution.lower(), "hour")

    from sqlalchemy import literal_column
    trunc_expr = func.date_trunc(literal_column(f"'{trunc_val}'"), ProductTelemetry.time)

    # Aggregate telemetry data using date_trunc
    stmt = (
        select(
            trunc_expr.label("bucket"),
            func.avg(ProductTelemetry.voltage).label("avg_voltage"),
            func.avg(ProductTelemetry.power).label("avg_power"),
            (func.max(ProductTelemetry.energy) - func.min(ProductTelemetry.energy)).label("energy_sum"),
        )
        .filter(
            ProductTelemetry.product_id == product_id,
            ProductTelemetry.time >= start_time,
            ProductTelemetry.time <= end_time,
        )
        .group_by(trunc_expr)
    )

    result = await db.execute(stmt)
    rows = result.all()

    for row in rows:
        # Perform PostgreSQL UPSERT on primary key (bucket, product_id, resolution)
        insert_stmt = insert(TelemetryRollup).values(
            bucket=row.bucket,
            product_id=product_id,
            resolution=resolution.lower(),
            avg_voltage=row.avg_voltage,
            avg_power=row.avg_power,
            energy_sum=row.energy_sum or 0.0,
        )

        upsert_stmt = insert_stmt.on_conflict_do_update(
            index_elements=["bucket", "product_id", "resolution"],
            set_={
                "avg_voltage": insert_stmt.excluded.avg_voltage,
                "avg_power": insert_stmt.excluded.avg_power,
                "energy_sum": insert_stmt.excluded.energy_sum,
            },
        )
        await db.execute(upsert_stmt)

    await db.commit()
