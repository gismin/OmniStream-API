"""
Router for /iot — Machine Telemetry Monitor.
Status is computed automatically from sensor thresholds on every ingest.
Phase 7: WebSocket endpoint broadcasts new readings to all connected clients.
"""

import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.iot_model import IoTReading, IoTStatus
from app.models.user_model import UserRole
from app.schemas.iot_schema import (
    IoTReadingCreate,
    IoTReadingResponse,
    TEMP_WARN, TEMP_CRIT,
    PRESSURE_WARN, PRESSURE_CRIT,
    VIBRATION_WARN, VIBRATION_CRIT,
)
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_role

router = APIRouter(prefix="/iot", tags=["IoT Telemetry"])


# ── WebSocket Connection Manager ──────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)


manager = ConnectionManager()


# ── Helpers ───────────────────────────────────────────────────────────────────

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


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket stream — broadcasts every new telemetry reading to all clients.
    Connect with: ws://localhost:8000/iot/ws
    """
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep connection alive, ignore client messages
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── REST Endpoints ────────────────────────────────────────────────────────────

@router.get("/", response_model=List[IoTReadingResponse], summary="List all telemetry readings")
def list_readings(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    return db.query(IoTReading).order_by(IoTReading.timestamp.desc()).all()


@router.post(
    "/",
    response_model=IoTReadingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a telemetry reading",
)
async def create_reading(
    payload: IoTReadingCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin, UserRole.operator)),
):
    """
    Ingest a new telemetry reading. Status computed automatically.
    Broadcasts the new reading to all WebSocket clients.
    """
    computed_status = _compute_status(
        payload.temperature, payload.pressure, payload.vibration
    )
    reading = IoTReading(**payload.model_dump(), status=computed_status)
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # Broadcast to all WebSocket clients
    await manager.broadcast({
        "id": reading.id,
        "device_id": reading.device_id,
        "device_name": reading.device_name,
        "temperature": reading.temperature,
        "pressure": reading.pressure,
        "vibration": reading.vibration,
        "status": reading.status.value,
        "timestamp": reading.timestamp.isoformat(),
    })

    return reading


@router.get("/{reading_id}", response_model=IoTReadingResponse, summary="Get a single reading")
def get_reading(
    reading_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    return _get_or_404(reading_id, db)


@router.get(
    "/device/{device_id}",
    response_model=List[IoTReadingResponse],
    summary="Get reading history for a device",
)
def get_device_history(
    device_id: str,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
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
def delete_reading(
    reading_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
):
    reading = _get_or_404(reading_id, db)
    db.delete(reading)
    db.commit()
