from fastapi import HTTPException, status

from app.models import User


def require_personal_storage(user: User) -> None:
    if not user.consent_personal_storage:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Personal storage consent required. Enable in account settings.",
        )


def require_research(user: User) -> bool:
    return bool(user.consent_research)
