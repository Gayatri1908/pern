from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin

class Company(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "companies"

    name = Column(String, nullable=False)
    gst_no = Column(String, nullable=True)
    address = Column(String, nullable=True)
    company_type = Column(String, nullable=True)

    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
