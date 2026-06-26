from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from celery.result import AsyncResult
from celery_app import celery_app
from tasks import analyze_audio_task
from config import settings
import shutil, uuid, os
from typing import Optional

router = APIRouter()
os.makedirs(settings.upload_dir, exist_ok=True)

@router.post("/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    """
    Accepts audio file, queues it for processing, returns task_id immediately.
    Frontend polls /task/{task_id} to get the result when ready.
    """
    if not file.content_type.startswith("audio/"):
        raise HTTPException(400, "Only audio files accepted")

    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(settings.upload_dir, temp_filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Enforce file size limit
    file_size_mb = os.path.getsize(temp_path) / (1024 * 1024)
    if file_size_mb > settings.max_audio_size_mb:
        os.remove(temp_path)
        raise HTTPException(400, f"Max size is {settings.max_audio_size_mb}MB")

    # Queue the task — returns immediately with a task ID
    # .delay() is Celery shorthand for .apply_async()
    task = analyze_audio_task.delay(temp_path, user_id)

    return {
        "task_id": task.id,
        "status": "queued",
        "message": "Audio received. Processing started."
    }


@router.get("/task/{task_id}")
async def get_task_result(task_id: str):
    """
    Poll this endpoint with the task_id to check processing status.
    Returns status: queued | processing | done | failed
    """
    task_result = AsyncResult(task_id, app=celery_app)

    if task_result.state == "PENDING":
        return {"status": "queued", "task_id": task_id}

    elif task_result.state == "STARTED":
        return {"status": "processing", "task_id": task_id}

    elif task_result.state == "SUCCESS":
        return {
            "status": "done",
            "task_id": task_id,
            "result": task_result.result
        }

    elif task_result.state == "FAILURE":
        return {
            "status": "failed",
            "task_id": task_id,
            "error": str(task_result.result)
        }

    else:
        return {"status": task_result.state.lower(), "task_id": task_id}