from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Traffic Violation System API"
    
    # GCP Cloud SQL config
    GCP_PROJECT: str = "your-gcp-project-id"
    GCP_REGION: str = "your-gcp-region"
    GCP_INSTANCE_NAME: str = "your-instance-name"
    GCP_BUCKET_NAME: str = "your-bucket-name"
    
    DB_USER: str = "postgres"
    DB_PASS: str = "postgres"
    DB_NAME: str = "traffic_system"
    
    # Optional local development URL fallback (e.g. for testing without GCP)
    LOCAL_DATABASE_URL: Optional[str] = None
    
    @property
    def INSTANCE_CONNECTION_NAME(self) -> str:
        return f"{self.GCP_PROJECT}:{self.GCP_REGION}:{self.GCP_INSTANCE_NAME}"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
