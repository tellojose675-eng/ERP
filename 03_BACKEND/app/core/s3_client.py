import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from app.core.config import settings

class S3Service:
    def __init__(self):
        self.bucket_name = settings.AWS_S3_BUCKET
        self.use_s3 = settings.USE_S3_STORAGE and settings.AWS_ACCESS_KEY_ID is not None
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)
        
        self.s3_client = None
        if self.use_s3:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
            except Exception as e:
                print(f"[AWS S3] Falló inicialización del cliente S3: {e}. Usando almacenamiento local.")
                self.use_s3 = False

    def upload_file(self, file_bytes: bytes, filename: str, content_type: str = "application/octet-stream") -> dict:
        """Sube un archivo a S3 o al almacenamiento local de contingencia."""
        s3_key = f"documents/{filename}"
        
        if self.use_s3 and self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=file_bytes,
                    ContentType=content_type
                )
                url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
                return {
                    "storage": "AWS_S3",
                    "bucket": self.bucket_name,
                    "key": s3_key,
                    "url": url,
                    "filename": filename
                }
            except (ClientError, NoCredentialsError) as e:
                print(f"[AWS S3] Error subiendo a S3: {e}. Fallback a almacenamiento local.")
        
        # Almacenamiento local (simulador cloud)
        local_path = os.path.join(self.upload_dir, filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        
        return {
            "storage": "LOCAL_S3_FALLBACK",
            "bucket": "local-storage",
            "key": filename,
            "url": f"/api/v1/documents/download/{filename}",
            "filename": filename
        }

    def get_file(self, filename: str):
        """Descarga u obtiene la ruta física o bytes del archivo."""
        local_path = os.path.join(self.upload_dir, filename)
        if os.path.exists(local_path):
            return {"type": "local_file", "path": local_path}
        
        if self.use_s3 and self.s3_client:
            try:
                s3_key = f"documents/{filename}"
                response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
                return {"type": "bytes", "body": response['Body'].read(), "content_type": response.get('ContentType')}
            except Exception as e:
                print(f"[AWS S3] Error descargando de S3: {e}")
        return None

s3_service = S3Service()
