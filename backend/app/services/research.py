import hashlib
import secrets
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import ResearchEvent


def _event_hash() -> str:
    """One-way anonymous event id — no user linkage."""
    raw = secrets.token_bytes(32) + settings.research_salt.encode()
    return hashlib.sha256(raw).hexdigest()


async def publish_research_event(
    db: AsyncSession,
    *,
    model_version: str,
    disease: str | None = None,
    bmi: float | None = None,
    smoking: bool | None = None,
    prs_mean: float | None = None,
    risk_mean: float | None = None,
    timestamp: datetime | None = None,
) -> None:
    event = ResearchEvent(
        event_hash=_event_hash(),
        timestamp=timestamp or datetime.now(timezone.utc),
        model_version=model_version,
        bmi=bmi,
        smoking=smoking,
        prs_mean=prs_mean,
        risk_mean=risk_mean,
        disease=disease,
    )
    db.add(event)
