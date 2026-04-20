"""Pydantic schemas for the /procurement module."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator
from app.models.procurement_model import ProcurementStatus, CEO_SIGNOFF_THRESHOLD


class ProcurementRequestBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    requester: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    cost: float = Field(..., gt=0, description="Cost in USD")


class ProcurementRequestCreate(ProcurementRequestBase):
    pass


class ProcurementRequestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    requester: Optional[str] = Field(None, min_length=1, max_length=100)
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    cost: Optional[float] = Field(None, gt=0)


class ProcurementStatusUpdate(BaseModel):
    status: ProcurementStatus


class ProcurementRequestResponse(ProcurementRequestBase):
    id: int
    status: ProcurementStatus
    requires_ceo_signoff: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
