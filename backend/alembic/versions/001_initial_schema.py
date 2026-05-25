"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("consent_personal_storage", sa.Boolean(), default=False),
        sa.Column("consent_research", sa.Boolean(), default=False),
    )
    op.create_table(
        "genetic_profiles",
        sa.Column("profile_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.user_id", ondelete="CASCADE")),
        sa.Column("prs_mean", sa.Float()),
        sa.Column("prs_variance", sa.Float()),
        sa.Column("ancestry_group", sa.String(64)),
        sa.Column("model_version", sa.String(64), nullable=False),
        sa.Column("prs_payload_json", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "phenotype_events",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.user_id", ondelete="CASCADE")),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("bmi", sa.Float()),
        sa.Column("smoking", sa.Boolean()),
        sa.Column("exercise_hours", sa.Float()),
        sa.Column("diet_score", sa.Float()),
        sa.Column("family_history_json", sa.Text()),
        sa.Column("notes", sa.Text()),
    )
    op.create_table(
        "risk_assessments",
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.user_id", ondelete="CASCADE")),
        sa.Column("disease", sa.String(64), nullable=False),
        sa.Column("risk_mean", sa.Float(), nullable=False),
        sa.Column("risk_sd", sa.Float(), nullable=False),
        sa.Column("model_version", sa.String(64), nullable=False),
        sa.Column("precision_level", sa.String(32)),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "research_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("event_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True)),
        sa.Column("model_version", sa.String(64), nullable=False),
        sa.Column("bmi", sa.Float()),
        sa.Column("smoking", sa.Boolean()),
        sa.Column("prs_mean", sa.Float()),
        sa.Column("risk_mean", sa.Float()),
        sa.Column("disease", sa.String(64)),
    )


def downgrade() -> None:
    op.drop_table("research_events")
    op.drop_table("risk_assessments")
    op.drop_table("phenotype_events")
    op.drop_table("genetic_profiles")
    op.drop_table("users")
