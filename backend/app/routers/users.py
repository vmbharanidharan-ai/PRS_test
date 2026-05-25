from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import MessageResponse, TokenResponse, UserCreate, UserLogin
from app.services.auth import create_access_token, hash_password, verify_password
from app.services.deletion import delete_user_data

router = APIRouter(prefix="/user", tags=["user"])


@router.post("/create", response_model=TokenResponse)
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        consent_personal_storage=body.consent_personal_storage,
        consent_research=body.consent_research,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.user_id),
        user_id=user.user_id,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(
        access_token=create_access_token(user.user_id),
        user_id=user.user_id,
    )


@router.delete("/delete", response_model=MessageResponse)
async def delete_user(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_user_data(db, user.user_id)
    return MessageResponse(
        message="All personal data deleted. Anonymized research events may be retained if previously consented."
    )
