"""Reporting and data export (CSV streams) router."""

from __future__ import annotations

import csv
import io
from datetime import datetime, timezone, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.alert import Alert, Complaint
from app.models.product import Product
from app.models.telemetry import TelemetryRollup
from app.models.user import User

router = APIRouter()


def stream_csv(headers: list[str], rows: list[list[any]]) -> StreamingResponse:
    """Helper to generate a memory-efficient StreamingResponse containing CSV formatted data."""
    def csv_generator():
        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(headers)
        yield output.getvalue()
        output.truncate(0)
        output.seek(0)

        # Write data rows
        for row in rows:
            writer.writerow(row)
            yield output.getvalue()
            output.truncate(0)
            output.seek(0)

    return StreamingResponse(
        csv_generator(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=report.csv"},
    )


@router.get("/energy")
async def export_energy_report(
    product_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Export a CSV report of telemetry energy rollups. Scoped by ownership."""
    # 1. Ownership scoping checks
    product_ids = []
    if product_id:
        prod_res = await db.execute(select(Product).filter(Product.id == product_id))
        product = prod_res.scalars().first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
        if current_user.role.lower() != "admin" and product.owner_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        product_ids = [product_id]
    else:
        # Find all accessible product IDs
        stmt = select(Product.id)
        if current_user.role.lower() != "admin":
            stmt = stmt.filter(Product.owner_user_id == current_user.id)
        res = await db.execute(stmt)
        product_ids = list(res.scalars().all())

    if not product_ids:
        return stream_csv(["Bucket", "Product ID", "Resolution", "Avg Voltage", "Avg Power", "Energy Sum"], [])

    # Time filters defaults
    if not end_time:
        end_time = datetime.now(timezone.utc)
    if not start_time:
        start_time = end_time - timedelta(days=30)

    # 2. Query TelemetryRollup
    stmt = (
        select(TelemetryRollup)
        .filter(
            TelemetryRollup.product_id.in_(product_ids),
            TelemetryRollup.bucket >= start_time,
            TelemetryRollup.bucket <= end_time,
        )
        .order_by(TelemetryRollup.bucket.desc())
    )
    result = await db.execute(stmt)
    rollups = result.scalars().all()

    # 3. Stream compiled rows
    headers = ["Bucket", "Product ID", "Resolution", "Avg Voltage", "Avg Power", "Energy Sum"]
    rows = [
        [
            r.bucket.isoformat(),
            str(r.product_id),
            r.resolution,
            r.avg_voltage,
            r.avg_power,
            r.energy_sum,
        ]
        for r in rollups
    ]
    return stream_csv(headers, rows)


@router.get("/failures")
async def export_failures_report(
    product_id: UUID | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Export a CSV report of failure/breach alerts. Scoped by ownership."""
    stmt = select(Alert).join(Product, Alert.product_id == Product.id)

    # Scoping
    if current_user.role.lower() != "admin":
        stmt = stmt.filter(Product.owner_user_id == current_user.id)

    if product_id:
        stmt = stmt.filter(Alert.product_id == product_id)

    stmt = stmt.order_by(Alert.created_at.desc())
    result = await db.execute(stmt)
    alerts = result.scalars().all()

    headers = ["Alert ID", "Product ID", "Metric", "Value", "Severity", "Status", "Suggested Solution", "Created At"]
    rows = [
        [
            str(a.id),
            str(a.product_id),
            a.metric,
            a.value,
            a.severity,
            a.status,
            a.suggested_solution,
            a.created_at.isoformat(),
        ]
        for a in alerts
    ]
    return stream_csv(headers, rows)


@router.get("/complaints")
async def export_complaints_report(
    product_id: UUID | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Export a CSV report of customer support complaints. Scoped by ownership."""
    stmt = select(Complaint).join(Product, Complaint.product_id == Product.id)

    # Scoping
    if current_user.role.lower() != "admin":
        stmt = stmt.filter(Complaint.product.has(owner_user_id=current_user.id)) # Or join on Product as done below

    stmt = select(Complaint).join(Product, Complaint.product_id == Product.id)
    if current_user.role.lower() != "admin":
        stmt = stmt.filter(Product.owner_user_id == current_user.id)

    if product_id:
        stmt = stmt.filter(Complaint.product_id == product_id)

    stmt = stmt.order_by(Complaint.created_at.desc())
    result = await db.execute(stmt)
    complaints = result.scalars().all()

    headers = ["Complaint ID", "Product ID", "Category", "Priority", "Status", "Media URLs Count", "Created At"]
    rows = [
        [
            str(c.id),
            str(c.product_id),
            c.category,
            c.priority,
            c.status,
            len(c.media_urls) if c.media_urls else 0,
            c.created_at.isoformat(),
        ]
        for c in complaints
    ]
    return stream_csv(headers, rows)
