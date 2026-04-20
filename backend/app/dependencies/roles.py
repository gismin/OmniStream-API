"""RBAC dependency factory — require_role(*roles)."""

from fastapi import Depends, HTTPException, status
from app.models.user_model import User, UserRole
from app.dependencies.auth import get_current_user


def require_role(*allowed_roles: UserRole):
    """
    FastAPI dependency factory.
    Usage: Depends(require_role(UserRole.admin, UserRole.operator))
    """
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not authorized for this action.",
            )
        return current_user
    return checker
