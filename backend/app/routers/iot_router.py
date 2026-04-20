"""
Router for /iot — Machine Telemetry Monitor.
Status is computed automatically from sensor thresholds on every ingest.
WebSocket streaming is added in Phase 7.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.iot_model import IoTReading, IoTStatus
from app.schemas.iot_schema import (
    IoTReadingCreate,
    IoTReadingResponse,
    TEMP_WARN, TEMP_CRIT,
    PRESSURE_WARN, PRESSURE_CRIT,
    VIBRATION_WARN, VIBRATION_CRIT,
)

router = APIRouter(prefix="/iot", tags=["IoT Telemetry"])


def _compute_status(temperature: float, pressure: float, vibration: float) -> IoTStatus:
    """Derive IoT status from the worst-case sensor reading."""
    if temperature >= TEMP_CRIT or pressure >= PRESSURE_CRIT or vibration >= VIBRATION_CRIT:
        return IoTStatus.critical
    if temperature >= TEMP_WARN or pressure >= PRESSURE_WARN or vibration >= VIBRATION_WARN:
        return IoTStatus.warning
    return IoTStatus.normal


def _get_or_404(reading_id: int, db: Session) -> IoTReading:
    reading = db.get(IoTReading, reading_id)
    if not reading:
        raise HTTPException(status_code=404, detail=f"IoT reading {reading_id} not found")
    return reading


@router.get("/", response_model=List[IoTReadingResponse], summary="List all telemetry readings")
def list_readings(db: Session = Depends(get_db)):
    """Return all readings ordered by timestamp descending."""
    return db.query(IoTReading).order_by(IoTReading.timestamp.desc()).all()


@router.post(
    "/",
    response_model=IoTReadingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a telemetry reading",
)
def create_reading(payload: IoTReadingCreate, db: Session = Depends(get_db)):
    """
    Ingest a new telemetry reading. Status is computed automatically:
    - Normal: all sensors below warning thresholds
    - Warning: at least one sensor at or above warning threshold
    - Critical: at least one sensor at or above critical threshold
    """
    computed_status = _compute_status(
        payload.temperature, payload.pressure, payload.vibration
    )
    reading = IoTReading(**payload.model_dump(), status=computed_status)
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@router.get("/{reading_id}", response_model=IoTReadingResponse, summary="Get a single reading")
def get_reading(reading_id: int, db: Session = Depends(get_db)):
    return _get_or_404(reading_id, db)


@router.get(
    "/device/{device_id}",
    response_model=List[IoTReadingResponse],
    summary="Get reading history for a device",
)
def get_device_history(device_id: str, db: Session = Depends(get_db)):
    """Return all readings for a specific device, newest first."""
    readings = (
        db.query(IoTReading)
        .filter(IoTReading.device_id == device_id)
        .order_by(IoTReading.timestamp.desc())
        .all()
    )
    if not readings:
        raise HTTPException(status_code=404, detail=f"No readings found for device '{device_id}'")
    return readings


@router.delete(
    "/{reading_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a reading",
)
def delete_reading(reading_id: int, db: Session = Depends(get_db)):
    reading = _get_or_404(reading_id, db)
    db.delete(reading)
    db.commit()
