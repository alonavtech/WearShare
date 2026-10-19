from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""
    groq_model: str = "qwen/qwen3.8-27b"

    database_url: str = ""

    auth0_domain: str = ""
    auth0_audience: str = ""

    secret_key: str = "dev-secret-change-me"
    cors_origins: str = "*"
    app_timezone: str = "America/New_York"
    upload_dir: str = "uploads"
    max_upload_mb: int = 8
    app_env: str = "development"  # set to "production" on the Vultr server

    def validate_production(self) -> None:
        """Refuse to start in production with unsafe settings (e.g. dev login left on)."""
        if self.app_env.lower() != "production":
            return
        problems = []
        if self.dev_auth:
            problems.append("AUTH0_DOMAIN and AUTH0_AUDIENCE must be set (dev login is not allowed in production)")
        if self.secret_key.startswith(("dev-secret", "change-me")) or len(self.secret_key) < 24:
            problems.append("SECRET_KEY must be a long random string")
        if not self.database_url:
            problems.append("DATABASE_URL must point to Tiger Data")
        if problems:
            raise RuntimeError("Unsafe production configuration: " + "; ".join(problems))

    @property
    def db_url(self) -> str:
        url = self.database_url.strip()
        if not url:
            return "sqlite:///./wearshare.db"
        # Tiger Data gives "postgresql://..."; SQLAlchemy must be told to use the psycopg v3 driver.
        for prefix in ("postgresql://", "postgres://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix):]
        return url

    @property
    def dev_auth(self) -> bool:
        """Dev login is on when Auth0 is not configured."""
        return not (self.auth0_domain and self.auth0_audience)

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
