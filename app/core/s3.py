import aioboto3
from app.core.config import settings


class S3Service:
    def __init__(self):
        self.session = aioboto3.Session()


    async def upload_recipe_image(self, file_content: bytes, file_name: str, content_type: str) -> str:
        async with self.session.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION,
        ) as s3:
            try:
                await s3.create_bucket(Bucket=settings.S3_BUCKET_NAME)
            except Exception:
                pass

            # DODAJEMY: ACL='public-read'
            await s3.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=file_name,
                Body=file_content,
                ContentType=content_type,
                ACL='public-read'  # To pozwala przeglądarce wyświetlić plik
            )

            return f"http://localhost:4566/{settings.S3_BUCKET_NAME}/{file_name}"
s3_service = S3Service()