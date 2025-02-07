from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    VERIFICATION_CODE_EXPIRY: int = 5  # minutes
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION: int = 30  # minutes
    CASE_SENSITIVE_LOGIN: bool = True
    DEFAULT_LANGUAGE: str = "en"
    ALLOWED_LANGUAGES: list[str] = ["en", "zh"]
    REMEMBER_ME_DAYS: int = 30

settings = Settings()
