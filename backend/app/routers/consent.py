from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import ConsentResponse, ConsentUpdate

router = APIRouter(prefix="/consent", tags=["consent"])


@router.post("/update", response_model=ConsentResponse)
async def update_consent(
    body: ConsentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.consent_personal_storage = body.consent_personal_storage
    user.consent_research = body.consent_research
    await db.commit()
    await db.refresh(user)
    return ConsentResponse(
        consent_personal_storage=user.consent_personal_storage,
        consent_research=user.consent_research,
    )


@router.get("/status", response_model=ConsentResponse)
async def consent_status(user: User = Depends(get_current_user)):
    return ConsentResponse(
        consent_personal_storage=user.consent_personal_storage,
        consent_research=user.consent_research,
    )
