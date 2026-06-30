from datetime import timedelta
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):

    # App
    app_name: str = "SpeakWell API"
    debug: bool = False
    environment: str = Field(default="development", env="ENVIRONMENT")

    # CORS
    allowed_origins: list[str] = Field(
        default=["http://localhost:3000"],
        env="ALLOWED_ORIGINS"
    )

    # AI Services
    groq_api_key: str = Field(..., env="GROQ_API_KEY")
    groq_model: str = Field(
        default="llama-3.3-70b-versatile",
        env="GROQ_MODEL" # overridable without code change
    )

    # Whisper
    whisper_model: str = Field(
        default="base",
        env="WHISPER_MODEL"
    )
    whisper_cache_dir: str = Field(
        default="/root/.cache/whisper",
        env="WHISPER_CACHE_DIR"
    )

    # Supabase
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_service_key: str = Field(..., env="SUPABASE_SERVICE_KEY")

    # Storage
    upload_dir: str = Field(default="uploaded_audio", env="UPLOAD_DIR")
    output_dir: str = Field(default="generated_audio", env="OUTPUT_DIR")
    max_audio_size_mb: int = Field(default=25, env="MAX_AUDIO_SIZE_MB")

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    celery_result_ttl: int = Field(default=3600, env="CELERY_RESULT_TTL")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()