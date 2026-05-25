from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    consent_personal_storage: bool = False
    consent_research: bool = False


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID


class ConsentUpdate(BaseModel):
    consent_personal_storage: bool
    consent_research: bool


class ConsentResponse(BaseModel):
    consent_personal_storage: bool
    consent_research: bool


class PhenotypeUpdate(BaseModel):
    bmi: float | None = None
    smoking: bool | None = None
    exercise_hours: float | None = None
    diet_score: float | None = None
    family_history_json: str | None = None
    notes: str | None = None


class GeneticUpload(BaseModel):
    prs_mean: float | None = None
    prs_variance: float | None = None
    ancestry_group: str | None = None
    model_version: str
    prs_payload_json: str | None = None


class RiskRecord(BaseModel):
    disease: str
    risk_mean: float
    risk_sd: float
    model_version: str
    precision_level: str | None = None


class RiskRecalculate(BaseModel):
    assessments: list[RiskRecord]
    model_version: str


class RiskAssessmentOut(BaseModel):
    assessment_id: UUID
    disease: str
    risk_mean: float
    risk_sd: float
    model_version: str
    precision_level: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    message: str
