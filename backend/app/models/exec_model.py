"""SQLAlchemy model for executive workflow items."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from app.database import Base
import enum


class ExecStatus(str, enum.Enum):
    draft = "draft"
    review = "review"
    approved = "approved"
    rejected = "rejected"


class ExecWorkflow(Base):
    __tablename__ = "exec_workflows"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner = Column(String(100), nullable=False)
    status = Column(Enum(ExecStatus), default=ExecStatus.draft, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
