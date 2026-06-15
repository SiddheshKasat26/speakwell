from celery_app import celery_app
from services.pipeline import run_full_pipeline

@celery_app.task(
    bind=True, # gives access to self (the task instance)
    max_retries=2, # retry up to 2 times on failure
    soft_time_limit=120, # warn after 2 minutes
    time_limit=180, # hard kill after 3 minutes
)
def analyze_audio_task(self, audio_file_path: str, user_id: str = None):
    """
    Background task that runs the full AI pipeline.
    Decorated with @celery_app.task so Celery knows to register it.
    """
    try:
        result = run_full_pipeline(audio_file_path, user_id=user_id)
        return result

    except Exception as e:
        # Retry the task — Celery will wait 5 seconds between retries
        raise self.retry(exc=e, countdown=5)