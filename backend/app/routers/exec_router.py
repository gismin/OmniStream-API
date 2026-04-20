"""
Router for /exec — Executive Workflow Tracker.
Status machine: Draft → Review → Approved (or Rejected).
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exec_model import ExecWorkflow, ExecStatus
from app.schemas.exec_schema import (
    ExecWorkflowCreate,
    ExecWorkflowUpdate,
    ExecWorkflowResponse,
    ExecStatusUpdate,
)

router = APIRouter(prefix="/exec", tags=["Executive Workflows"])

# Valid status transitions
ALLOWED_TRANSITIONS = {
    ExecStatus.draft: {ExecStatus.review},
    ExecStatus.review: {ExecStatus.approved, ExecStatus.rejected},
    ExecStatus.approved: set(),
    ExecStatus.rejected: set(),
}


def _get_or_404(workflow_id: int, db: Session) -> ExecWorkflow:
    workflow = db.get(ExecWorkflow, workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    return workflow


@router.get("/", response_model=List[ExecWorkflowResponse], summary="List all workflows")
def list_workflows(db: Session = Depends(get_db)):
    """Return all executive workflows ordered by creation date descending."""
    return db.query(ExecWorkflow).order_by(ExecWorkflow.created_at.desc()).all()


@router.post(
    "/",
    response_model=ExecWorkflowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workflow",
)
def create_workflow(payload: ExecWorkflowCreate, db: Session = Depends(get_db)):
    """Create a new workflow. Initial status is always Draft."""
    workflow = ExecWorkflow(**payload.model_dump(), status=ExecStatus.draft)
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.get("/{workflow_id}", response_model=ExecWorkflowResponse, summary="Get a workflow")
def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    return _get_or_404(workflow_id, db)


@router.put("/{workflow_id}", response_model=ExecWorkflowResponse, summary="Update a workflow")
def update_workflow(
    workflow_id: int, payload: ExecWorkflowUpdate, db: Session = Depends(get_db)
):
    """Update title, description, or owner. Status changes use the PATCH /status endpoint."""
    workflow = _get_or_404(workflow_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)
    workflow.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.patch(
    "/{workflow_id}/status",
    response_model=ExecWorkflowResponse,
    summary="Transition workflow status",
)
def update_status(
    workflow_id: int, payload: ExecStatusUpdate, db: Session = Depends(get_db)
):
    """
    Transition workflow status following the state machine:
    Draft → Review → Approved | Rejected
    """
    workflow = _get_or_404(workflow_id, db)
    allowed = ALLOWED_TRANSITIONS.get(workflow.status, set())
    if payload.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot transition from '{workflow.status}' to '{payload.status}'. "
                f"Allowed transitions: {[s.value for s in allowed] or 'none (terminal state)'}"
            ),
        )
    workflow.status = payload.status
    workflow.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.delete(
    "/{workflow_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workflow",
)
def delete_workflow(workflow_id: int, db: Session = Depends(get_db)):
    workflow = _get_or_404(workflow_id, db)
    db.delete(workflow)
    db.commit()
