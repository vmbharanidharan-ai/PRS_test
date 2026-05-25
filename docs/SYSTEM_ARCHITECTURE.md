# GeneScope — Privacy-Preserving System Architecture

## 3-layer separation

```
[ Client (iOS / Web) ]
        |
        | HTTPS + JWT (encrypted in transit)
        v
[ API Layer — FastAPI ]
        |
        | consent enforcement on every write
        v
┌──────────────────────────────────────────────┐
│              DATA LAYER (Postgres)            │
├──────────────────────────────────────────────┤
│ (A) Identity — users                          │
│ (B) Phenotype — phenotype_events (time-series) │
│ (C) Genetic — genetic_profiles (PRS summary)  │
│ (D) Risk — risk_assessments (longitudinal)    │
│ (E) Research — research_events (NO user_id)   │
└──────────────────────────────────────────────┘
```

**Rule:** Identity never touches `research_events`. Research rows use one-way `event_hash` only.

## Client modes

| Mode | Storage | History | Research |
|------|---------|---------|----------|
| **Local-only** | None (browser only) | No | No |
| **Private account** | Phenotype + PRS + risk | Yes | No (unless opted in) |
| **Research** | Separate checkbox | — | Anonymized aggregates only |

Consents **(2) and (3) are separate** — never bundled.

## API endpoints

| Method | Path | Auth | Consent required |
|--------|------|------|------------------|
| POST | `/user/create` | No | Set on create |
| POST | `/user/login` | No | — |
| POST | `/consent/update` | JWT | — |
| GET | `/consent/status` | JWT | — |
| POST | `/phenotype/update` | JWT | `consent_personal_storage` |
| POST | `/genetic/upload` | JWT | `consent_personal_storage` |
| GET | `/risk/history` | JWT | `consent_personal_storage` |
| POST | `/risk/recalculate` | JWT | `consent_personal_storage` |
| DELETE | `/user/delete` | JWT | Full GDPR delete |
| GET | `/health` | No | — |

## Model versioning

Every stored risk assessment includes `model_version` (e.g. `PGS005104-v2024`).

## Run backend

```bash
docker compose up -d postgres
cd backend && pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in web `.env.local`.
