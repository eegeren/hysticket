from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    admin_password: str
    jwt_secret: str
    jwt_expires_days: int = 7
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    allowed_origins: List[str] = ["http://localhost:3000"]
    file_storage_backend: str = "local"
    upload_dir: str = "/app/uploads"
    s3_endpoint: Union[str, None] = None
    s3_bucket: Union[str, None] = None
    s3_region: Union[str, None] = None
    s3_access_key: Union[str, None] = None
    s3_secret_key: Union[str, None] = None

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_origins(cls, v: Union[str, List[str]]):
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
