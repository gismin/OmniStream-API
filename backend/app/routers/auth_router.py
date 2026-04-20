"""
Router for /auth — Login and token refresh.
Returns JWT access + refresh tokens on successful login.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_model import User
from app.schemas.auth_schema import LoginRequest, TokenResponse, UserResponse
from app.auth.jwt import verify_password, create_access_token, create_refresh_token, decode_token
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, summary="Login and receive JWT tokens")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate with username + password.
    Returns access token (30 min) and refresh token (7 days).
    """
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    return TokenResponse(
        access_token=create_access_token(user.username, user.role),
        refresh_token=create_refresh_token(user.username, user.role),
    )


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
def refresh_token(refresh_token_str: str, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    try:
        payload = decode_token(refresh_token_str)
        if not payload.get("refresh"):
            raise ValueError("Not a refresh token")
        username = payload.get("sub")
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("User not found")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    return TokenResponse(
        access_token=create_access_token(user.username, user.role),
        refresh_token=create_refresh_token(user.username, user.role),
    )


@router.get("/me", response_model=UserResponse, summary="Get current user info")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
