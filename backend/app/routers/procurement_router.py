"""
Router for /procurement — CapEx Request Management.
Auto-sets requires_ceo_signoff = True when cost > $50,000.
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.procurement_model import ProcurementRequest, ProcurementStatus, CEO_SIGNOFF_THRESHOLD
from app.schemas.procurement_schema import (
    ProcurementRequestCreate,
    ProcurementRequestUpdate,
    ProcurementRequestResponse,
    ProcurementStatusUpdate,
)

router = APIRouter(prefix="/procurement", tags=["Procurement"])


def _get_or_404(request_id: int, db: Session) -> ProcurementRequest:
    req = db.get(ProcurementRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail=f"Procurement request {request_id} not found")
    return req


@router.get(
    "/",
    response_model=List[ProcurementRequestResponse],
    summary="List all procurement requests",
)
def list_requests(db: Session = Depends(get_db)):
    """Return all requests ordered by creation date descending."""
    return (
        db.query(ProcurementRequest)
        .order_by(ProcurementRequest.created_at.desc())
        .all()
    )


@router.post(
    "/",
    response_model=ProcurementRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a procurement request",
)
def create_request(payload: ProcurementRequestCreate, db: Session = Depends(get_db)):
    """
    Submit a new CapEx request. Business rule:
    - If cost > $50,000 → requires_ceo_signoff is automatically set to True.
    """
    needs_ceo = payload.cost > CEO_SIGNOFF_THRESHOLD
    req = ProcurementRequest(
        **payload.model_dump(),
        status=ProcurementStatus.pending,
        requires_ceo_signoff=needs_ceo,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get(
    "/{request_id}",
    response_model=ProcurementRequestResponse,
    summary="Get a procurement request",
)
def get_request(request_id: int, db: Session = Depends(get_db)):
    return _get_or_404(request_id, db)


@router.put(
    "/{request_id}",
    response_model=ProcurementRequestResponse,
    summary="Update a procurement request",
)
def update_request(
    request_id: int, payload: ProcurementRequestUpdate, db: Session = Depends(get_db)
):
    """Update fields. If cost changes, CEO signoff flag is recalculated automatically."""
    req = _get_or_404(request_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(req, field, value)
    # Recalculate CEO flag if cost was updated
    if "cost" in update_data:
        req.requires_ceo_signoff = req.cost > CEO_SIGNOFF_THRESHOLD
    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req


@router.patch(
    "/{request_id}/status",
    response_model=ProcurementRequestResponse,
    summary="Approve or reject a request",
)
def update_status(
    request_id: int, payload: ProcurementStatusUpdate, db: Session = Depends(get_db)
):
    """Transition status from Pending to Approved or Rejected."""
    req = _get_or_404(request_id, db)
    if req.status != ProcurementStatus.pending:
        raise HTTPException(
            status_code=400,
            detail=f"Request is already '{req.status}'. Only pending requests can be actioned.",
        )
    if payload.status == ProcurementStatus.pending:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'.")
    req.status = payload.status
    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req


@router.delete(
    "/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a procurement request",
)
def delete_request(request_id: int, db: Session = Depends(get_db)):
    req = _get_or_404(request_id, db)
    db.delete(req)
    db.commit()
