from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.deps import get_current_user
from app.models import User
from app.services.consent import require_personal_storage
from app.services.pgscalc_runner import run_pgsc_calc

router = APIRouter(prefix="/scoring", tags=["scoring"])


class PgscCalcRequest(BaseModel):
    genotype_path: str
    pgs_id: str
    ancestry: str = "EUR"


@router.post("/pgscalc")
async def score_with_pgscalc(
    body: PgscCalcRequest,
    user: User = Depends(get_current_user),
):
    """
    Server-side PGS Catalog Calculator (account mode).
    Requires Docker with pgsc_calc image and encrypted genotype upload path.
    """
    require_personal_storage(user)

    path = Path(body.genotype_path)
    if not path.is_file():
        raise HTTPException(400, "genotype_path not found on server")

    try:
        result = run_pgsc_calc(path, body.pgs_id, body.ancestry)
    except RuntimeError as e:
        raise HTTPException(502, str(e)) from e

    return result
