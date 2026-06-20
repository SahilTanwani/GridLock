import os
import datetime
import asyncio
from typing import Optional
from google.cloud import storage
from app.core.config import settings

# Initialize GCP Storage client. 
# It automatically picks up credentials from the GOOGLE_APPLICATION_CREDENTIALS environment variable.
storage_client = storage.Client(project=settings.GCP_PROJECT)
bucket = storage_client.bucket(settings.GCP_BUCKET_NAME)

async def generate_resumable_upload_url(
    object_name: str, 
    content_type: str = "video/mp4", 
    expiration_minutes: int = 60
) -> str:
    """
    Generates a pre-signed URL for a resumable upload (optimized for large video files).
    
    The frontend client must make an initial POST request to this URL with the 
    'x-goog-resumable: start' header. It will receive a 201 Created response with a 
    'Location' header containing the actual session URI where chunks can be uploaded via PUT.
    """
    def _generate_url():
        blob = bucket.blob(object_name)
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=expiration_minutes),
            method="POST",
            headers={"x-goog-resumable": "start"},
            content_type=content_type
        )
        return url

    # Run in threadpool because generate_signed_url uses cryptographic signing that can block the event loop
    return await asyncio.to_thread(_generate_url)


async def upload_evidence_image(
    file_bytes: bytes, 
    object_name: str, 
    content_type: str = "image/jpeg"
) -> str:
    """
    Securely uploads a processed evidence image (annotated JPEG) from the backend directly to GCP.
    Returns a long-lived signed URL to be stored in the database's evidence_path column.
    """
    def _upload():
        blob = bucket.blob(object_name)
        
        # Upload the bytes to the bucket
        blob.upload_from_string(file_bytes, content_type=content_type)
        
        # Generate a signed URL for reading (valid for 7 days, maximum for service account credentials)
        # Alternatively, if the bucket/object is made public, we could just return `blob.public_url`
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(days=7),
            method="GET"
        )
        return signed_url

    return await asyncio.to_thread(_upload)
