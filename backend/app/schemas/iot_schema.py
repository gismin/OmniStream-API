"""Pydantic schemas for the /iot module."""

from datetime import datetime
from pydantic import BaseModel, Field
from app.models.iot_model import IoTStatus

# Thresholds that determine status on ingest
TEMP_WARN = 75.0
TEMP_CRIT = 90.0
PRESSURE_WARN = 80.0
PRESSURE_CRIT = 95.0
VIBRATION_WARN = 5.0
VIBRATION_CRIT = 8.0


class IoTReadingBase(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=100)
    device_name: str = Field(..., min_length=1, max_length=255)
    temperature: float = Field(..., description="Celsius")
    pressure: float = Field(..., description="Bar")
    vibration: float = Field(..., description="mm/s")


class IoTReadingCreate(IoTReadingBase):
    pass


class IoTReadingResponse(IoTReadingBase):
    id: int
    status: IoTStatus
    timestamp: datetime

    model_config = {"from_attributes": True}
