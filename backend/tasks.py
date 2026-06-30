from celery_app import celery_app
from services.pipeline import run_full_pipeline
from services.supabase_service import download_audio_from_url
import uuid
import os

@celery_app.task(
    bind=True,
    max_retries=2,
    soft_time_limit=120,
    time_limit=180,
)
def analyze_audio_task(self, audio_url: str, user_id: str = None):
    """
    Background task — downloads audio from Supabase Storage URL,
    runs pipeline, cleans up local temp file.
    """
    local_path = f"/tmp/{uuid.uuid4()}.webm"

    try:
        # Download from Supabase Storage to local temp file
        download_audio_from_url(audio_url, local_path)

        result = run_full_pipeline(local_path, user_id=user_id)
        return result

    except Exception as e:
        raise self.retry(exc=e, countdown=5)

    finally:
        # Always clean up temp file, success or failure
        if os.path.exists(local_path):
            os.remove(local_path)