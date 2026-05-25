# GeneScope API

Privacy-preserving FastAPI backend with 4-layer data separation.

## Quick start

```bash
# From repo root
docker compose up -d postgres

cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Architecture

See [../docs/SYSTEM_ARCHITECTURE.md](../docs/SYSTEM_ARCHITECTURE.md).
