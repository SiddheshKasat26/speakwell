from celery import Celery
from config import settings

# Create the Celery application
# First argument is the name of the module — used for task naming
# broker — where Celery reads tasks FROM (Redis)
# backend — where Celery writes results TO (Redis)
celery_app = Celery(
    "speakwell",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["tasks"] # ← tells Celery to import tasks.py on startup
)

# Configuration
celery_app.conf.update(
    # How long results stay in Redis before expiring
    result_expires=settings.celery_result_ttl,

    # Task serialization format — JSON is safe and readable
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    # Timezone
    timezone="UTC",
    enable_utc=True,

    # If a task fails, don't retry automatically by default
    # We'll add retry logic per-task where needed
    task_acks_late=True,
)