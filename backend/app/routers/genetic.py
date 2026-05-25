from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import GeneticProfile, User
from app.schemas import GeneticUpload, MessageResponse
from app.services.consent import require_personal_storage, require_research
from app.services.research import publish_research_event

router = APIRouter(prefix="/genetic", tags=["genetic"])


@router.post("/upload", response_model=MessageResponse)
async def upload_genetic(
    body: GeneticUpload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Store PRS summary — not raw SNPs in research layer.
    Raw genotype should remain client-side unless explicitly consented for encrypted storage.
    """
    require_personal_storage(user)

    profile = GeneticProfile(
        user_id=user.user_id,
        prs_mean=body.prs_mean,
        prs_variance=body.prs_variance,
        ancestry_group=body.ancestry_group,
        model_version=body.model_version,
        prs_payload_json=body.prs_payload_json,
    )
    db.add(profile)
    await db.commit()

    if require_research(user):
        await publish_research_event(
            db,
            model_version=body.model_version,
            prs_mean=body.prs_mean,
        )
        await db.commit()

    return MessageResponse(
        message="Genetic profile stored (PRS summary). Raw DNA not sent to research."
    )
