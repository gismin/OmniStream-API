"""SQLAlchemy model for IoT machine telemetry readings."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from app.database import Base
import enum


class IoTStatus(str, enum.Enum):
    normal = "normal"
    warning = "warning"
    critical = "critical"


class IoTReading(Base):
    __tablename__ = "iot_readings"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), nullable=False, index=True)
    device_name = Column(String(255), nullable=False)
    temperature = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    status = Column(Enum(IoTStatus), default=IoTStatus.normal, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
