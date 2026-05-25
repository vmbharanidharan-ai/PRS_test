from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import consent, genetic, phenotype, risk, scoring, users

app = FastAPI(
    title="GeneScope API",
    description="Privacy-preserving longitudinal polygenic risk backend",
    version="0.1.0",
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(consent.router)
app.include_router(phenotype.router)
app.include_router(genetic.router)
app.include_router(risk.router)
app.include_router(scoring.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "genescreen-api"}
