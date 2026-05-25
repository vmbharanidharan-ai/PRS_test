from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import GeneticProfile, PhenotypeEvent, RiskAssessment, User


async def delete_user_data(db: AsyncSession, user_id: UUID) -> None:
    """GDPR-style deletion: identity + phenotype + genetic + risk."""
    await db.execute(delete(RiskAssessment).where(RiskAssessment.user_id == user_id))
    await db.execute(delete(PhenotypeEvent).where(PhenotypeEvent.user_id == user_id))
    await db.execute(delete(GeneticProfile).where(GeneticProfile.user_id == user_id))
    await db.execute(delete(User).where(User.user_id == user_id))
    await db.commit()
