"""
Router for /procurement — CapEx Request Management.
Auto-sets requires_ceo_signoff = True when cost > $50,000.
Phase 7: Protected with JWT auth + RBAC.
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.procurement_model import ProcurementRequest, ProcurementStatus, CEO_SIGNOFF_THRESHOLD
from app.models.user_model import UserRole
from app.schemas.procurement_schema import (
    ProcurementRequestCreate,
    ProcurementRequestUpdate,
    ProcurementRequestResponse,
    ProcurementStatusUpdate,
)
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_role

router = APIRouter(prefix="/procurement", tags=["Procurement"])


def _get_or_404(request_id: int, db: Session) -> ProcurementRequest:
    req = db.get(ProcurementRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail=f"Procurement request {request_id} not found")
    return req


@router.get("/", response_model=List[ProcurementRequestResponse], summary="List all requests")
def list_requests(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    return db.query(ProcurementRequest).order_by(ProcurementRequest.created_at.desc()).all()


@router.post(
    "/",
    response_model=ProcurementRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a procurement request",
)
def create_request(
    payload: ProcurementRequestCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin, UserRole.operator)),
):
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


@router.get("/{request_id}", response_model=ProcurementRequestResponse, summary="Get a request")
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    return _get_or_404(request_id, db)


@router.put("/{request_id}", response_model=ProcurementRequestResponse, summary="Update a request")
def update_request(
    request_id: int,
    payload: ProcurementRequestUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin, UserRole.operator)),
):
    req = _get_or_404(request_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(req, field, value)
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
    request_id: int,
    payload: ProcurementStatusUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin, UserRole.executive)),
):
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
    summary="Delete a request",
)
def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
):
    req = _get_or_404(request_id, db)
    db.delete(req)
    db.commit()
