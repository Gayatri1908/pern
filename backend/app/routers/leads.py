"""Public leads and inquiries capture router."""

from __future__ import annotations

import asyncio
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies.auth import RoleChecker
from app.models.lead import Lead
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadRead
from app.services.notifications import send_email_notification

router = APIRouter()


@router.post("/", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
async def submit_lead_inquiry(
    payload: LeadCreate,
    db: AsyncSession = Depends(get_db),
):
    """Public lead capture submission. Saves inquiry to database and dispatches mock email to sales."""
    lead = Lead(
        name=payload.name,
        email=payload.email,
        organization=payload.organization,
        message=payload.message,
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    # Dispatch email notification to sales
    sales_email = "sales@thesource-company.com"
    subject = f"New Inquiry from {lead.name}"
    body = (
        f"Inquiry Details:\n"
        f"Name: {lead.name}\n"
        f"Email: {lead.email}\n"
        f"Organization: {lead.organization or 'Not provided'}\n\n"
        f"Message:\n{lead.message}"
    )
    asyncio.create_task(send_email_notification(recipient=sales_email, subject=subject, body=body))

    return lead


@router.get("/", response_model=list[LeadRead])
async def list_leads(
    limit: int = 100,
    offset: int = 0,
    admin_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all lead inquiries. Restricted to Admins."""
    stmt = select(Lead).order_by(Lead.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    leads = result.scalars().all()
    return leads
