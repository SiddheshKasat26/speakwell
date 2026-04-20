from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "SpeakWell API"
    debug: bool = True
    groq_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()