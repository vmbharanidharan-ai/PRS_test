from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import RiskAssessment, User
from app.schemas import MessageResponse, RiskAssessmentOut, RiskRecalculate
from app.services.consent import require_personal_storage, require_research
from app.services.research import publish_research_event

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/history", response_model=list[RiskAssessmentOut])
async def risk_history(
    disease: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_personal_storage(user)
    q = select(RiskAssessment).where(RiskAssessment.user_id == user.user_id)
    if disease:
        q = q.where(RiskAssessment.disease == disease)
    q = q.order_by(RiskAssessment.timestamp.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/recalculate", response_model=MessageResponse)
async def recalculate_risk(
    body: RiskRecalculate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Persist risk assessments from client-computed PRS (or server model).
    Each record includes model_version for longitudinal tracking.
    """
    require_personal_storage(user)

    for rec in body.assessments:
        assessment = RiskAssessment(
            user_id=user.user_id,
            disease=rec.disease,
            risk_mean=rec.risk_mean,
            risk_sd=rec.risk_sd,
            model_version=rec.model_version or body.model_version,
            precision_level=rec.precision_level,
        )
        db.add(assessment)

        if require_research(user):
            await publish_research_event(
                db,
                model_version=rec.model_version or body.model_version,
                disease=rec.disease,
                risk_mean=rec.risk_mean,
            )

    await db.commit()
    return MessageResponse(
        message=f"Stored {len(body.assessments)} risk assessment(s) at version {body.model_version}"
    )
