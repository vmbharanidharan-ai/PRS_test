from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import PhenotypeEvent, User
from app.schemas import MessageResponse, PhenotypeUpdate
from app.services.consent import require_personal_storage, require_research
from app.services.research import publish_research_event

router = APIRouter(prefix="/phenotype", tags=["phenotype"])


@router.post("/update", response_model=MessageResponse)
async def update_phenotype(
    body: PhenotypeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_personal_storage(user)

    event = PhenotypeEvent(
        user_id=user.user_id,
        bmi=body.bmi,
        smoking=body.smoking,
        exercise_hours=body.exercise_hours,
        diet_score=body.diet_score,
        family_history_json=body.family_history_json,
        notes=body.notes,
    )
    db.add(event)
    await db.commit()

    if require_research(user):
        await publish_research_event(
            db,
            model_version="phenotype-v1",
            bmi=body.bmi,
            smoking=body.smoking,
        )
        await db.commit()

    return MessageResponse(message="Phenotype event recorded")
