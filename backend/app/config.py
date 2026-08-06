from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PORT: int = 4000
    NODE_ENV: str = "development"
    
    JWT_SECRET: str = "codingcon_super_secret_jwt_key_change_in_prod"
    JWT_EXPIRES_IN_DAYS: int = 7
    
    MONGODB_URI: str = "mongodb://127.0.0.1:27017/codingcon"
    REDIS_URL: str = "redis://127.0.0.1:6379/0"
    RABBITMQ_URL: str = "amqp://guest:guest@127.0.0.1:5672/"
    
    JUDGE_TIMEOUT_MS: int = 10000
    JUDGE_MEMORY_MB: int = 256
    JUDGE_USE_DOCKER: bool = False
    
    CORS_ORIGIN: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
