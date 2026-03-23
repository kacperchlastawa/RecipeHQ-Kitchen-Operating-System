from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    S3_ENDPOINT_URL: str = "http://localstack:4566"
    S3_ACCESS_KEY: str = "test"
    S3_SECRET_KEY: str = "test"
    S3_BUCKET_NAME: str = "recipe-photos"
    S3_REGION: str = "us-east-1"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()