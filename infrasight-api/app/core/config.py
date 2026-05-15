import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "InfraSight API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    MOCK_MODE: bool = True
    FIREBASE_PROJECT_ID: str = "infrasight-gzu"
    FIREBASE_SERVICE_ACCOUNT_PATH: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    FIREBASE_PRIVATE_KEY_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_CLIENT_ID: str = ""
    FIREBASE_AUTH_URI: str = "https://accounts.google.com/o/oauth2/auth"
    FIREBASE_TOKEN_URI: str = "https://oauth2.googleapis.com/token"
    ADMIN_USER_UID: str = "OUh12CwcJZgfhTYJvXS0lqYPwY52"

    @property
    def firebase_credentials_path(self) -> str:
        return self.FIREBASE_SERVICE_ACCOUNT_PATH or self.GOOGLE_APPLICATION_CREDENTIALS or os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
