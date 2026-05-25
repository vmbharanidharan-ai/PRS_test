from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://genescreen:genescreen@localhost:5432/genescreen"
    jwt_secret: str = "change-me-in-production-use-openssl-rand"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    research_salt: str = "change-research-salt-in-production"
    cors_origins: str = "http://localhost:3000"


settings = Settings()
