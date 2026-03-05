from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

# Backend package root — always resolves correctly regardless of CWD
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_DEFAULT_DB = f"sqlite:///{_BACKEND_DIR / 'portal.db'}"


class Settings(BaseSettings):
    APP_NAME: str = "Portal Inmobiliario"
    SECRET_KEY: str = "changeme-replace-with-long-random-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    DATABASE_URL: str = _DEFAULT_DB

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
