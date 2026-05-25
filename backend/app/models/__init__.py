import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    """Identity layer — never linked to research_events."""

    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    consent_personal_storage: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_research: Mapped[bool] = mapped_column(Boolean, default=False)

    genetic_profiles: Mapped[list["GeneticProfile"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    phenotype_events: Mapped[list["PhenotypeEvent"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    risk_assessments: Mapped[list["RiskAssessment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class GeneticProfile(Base):
    """Genetic / PRS layer — PRS summary only, not raw research-linked identity."""

    __tablename__ = "genetic_profiles"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), index=True
    )
    prs_mean: Mapped[float | None] = mapped_column(Float, nullable=True)
    prs_variance: Mapped[float | None] = mapped_column(Float, nullable=True)
    ancestry_group: Mapped[str | None] = mapped_column(String(64), nullable=True)
    model_version: Mapped[str] = mapped_column(String(64))
    prs_payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="genetic_profiles")


class PhenotypeEvent(Base):
    """Phenotype time-series layer."""

    __tablename__ = "phenotype_events"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), index=True
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    smoking: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    exercise_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    diet_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    family_history_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="phenotype_events")


class RiskAssessment(Base):
    """Computed risk outputs over time."""

    __tablename__ = "risk_assessments"

    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), index=True
    )
    disease: Mapped[str] = mapped_column(String(64), index=True)
    risk_mean: Mapped[float] = mapped_column(Float)
    risk_sd: Mapped[float] = mapped_column(Float)
    model_version: Mapped[str] = mapped_column(String(64))
    precision_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    user: Mapped["User"] = relationship(back_populates="risk_assessments")


class ResearchEvent(Base):
    """Anonymized research layer — NO user_id."""

    __tablename__ = "research_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    model_version: Mapped[str] = mapped_column(String(64))
    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    smoking: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    prs_mean: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_mean: Mapped[float | None] = mapped_column(Float, nullable=True)
    disease: Mapped[str | None] = mapped_column(String(64), nullable=True)
