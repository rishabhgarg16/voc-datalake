from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://voc:voc_secret@localhost:5432/voc_datalake"
    database_url_sync: str = "postgresql://voc:voc_secret@localhost:5432/voc_datalake"
    anthropic_api_key: str = ""
    data_dir: str = "/data"
    enrichment_concurrency: int = 15
    enrichment_model: str = "claude-haiku-4-5-20241022"

    # Deployment settings
    environment: Literal["development", "production"] = "development"
    cors_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
