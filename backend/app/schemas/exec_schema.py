"""Pydantic schemas for the /exec module."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.exec_model import ExecStatus


class ExecWorkflowBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    owner: str = Field(..., min_length=1, max_length=100)


class ExecWorkflowCreate(ExecWorkflowBase):
    pass


class ExecWorkflowUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    owner: Optional[str] = Field(None, min_length=1, max_length=100)


class ExecStatusUpdate(BaseModel):
    status: ExecStatus


class ExecWorkflowResponse(ExecWorkflowBase):
    id: int
    status: ExecStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
