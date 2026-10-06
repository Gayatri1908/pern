from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func

from app.database import Base
from app.models.base import UUIDMixin


class Lead(Base, UUIDMixin):
    """Lead capture records for CRM storage."""
    __tablename__ = "leads"

    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    organization = Column(String, nullable=True)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
