"""
Central application configuration.

All values can be overridden via environment variables or a `.env` file
(see `.env.example`). Defaults are chosen so the app runs immediately for
local development with zero setup (SQLite, permissive CORS).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- General ---
    PROJECT_NAME: str = "PackSure API"
    API_V1_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"  # development | production

    # --- Database ---
    # Defaults to a local SQLite file so `uvicorn app.main:app` works with no
    # external services. For production, point this at Postgres, e.g.:
    #   postgresql+psycopg2://packsure:packsure@localhost:5432/packsure
    DATABASE_URL: str = "sqlite:///./packsure.db"

    # --- Auth / JWT ---
    SECRET_KEY: str = "dev-secret-key-change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # --- CORS ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://10.71.135.140:5173",
    ]

    # --- File storage ---
    # Local disk storage for uploaded package images. Swap for S3/GCS in
    # production by replacing app/services/storage.py.
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 10


settings = Settings()
