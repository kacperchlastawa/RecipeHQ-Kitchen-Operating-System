from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str
    s3_bucket_name: str
    aws_endpoint_url: str
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"  # To sprawi, że nadmiarowe zmienne w .env nie będą powodować błędów
    )
settings = Settings()