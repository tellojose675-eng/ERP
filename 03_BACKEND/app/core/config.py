import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ERP EnterpriseCloud"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Base de Datos: SQLite por defecto para desarrollo local plug-and-play, o PostgreSQL para AWS RDS
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./erp_enterprisecloud.db")
    
    # Seguridad y JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "erp_enterprisecloud_secret_key_2026_super_secure_key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 horas
    
    # Configuración Cloud AWS (Semana 07)
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID", None)
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY", None)
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_S3_BUCKET: str = os.getenv("AWS_S3_BUCKET", "erp-enterprisecloud-documents")
    USE_S3_STORAGE: bool = os.getenv("USE_S3_STORAGE", "false").lower() in ("true", "1")
    
    # Directorio de subida local cuando no se usa S3 en modo offline
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
