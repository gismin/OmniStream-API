"""SQLAlchemy model for CapEx procurement requests."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, Enum
from app.database import Base
import enum

CEO_SIGNOFF_THRESHOLD = 50_000.0


class ProcurementStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ProcurementRequest(Base):
    __tablename__ = "procurement_requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    requester = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    cost = Column(Float, nullable=False)
    status = Column(Enum(ProcurementStatus), default=ProcurementStatus.pending, nullable=False)
    requires_ceo_signoff = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
