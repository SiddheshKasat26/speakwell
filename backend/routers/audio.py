from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from celery.result import AsyncResult
from celery_app import celery_app
from tasks import analyze_audio_task
from services.supabase_service import upload_audio_to_storage
from config import settings
from typing import Optional

router = APIRouter()

@router.post("/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(400, "Only audio files accepted")

    file_bytes = await file.read()

    # Enforce file size limit
    file_size_mb = len(file_bytes) / (1024 * 1024)
    if file_size_mb > settings.max_audio_size_mb:
        raise HTTPException(400, f"Max size is {settings.max_audio_size_mb}MB")

    # Upload to Supabase Storage — accessible from any service
    audio_url = upload_audio_to_storage(file_bytes, file.filename)
    print(f"[Audio] Uploaded to: {audio_url}")

    # Queue task with the URL, not a local path
    task = analyze_audio_task.delay(audio_url, user_id)

    return {
        "task_id": task.id,
        "status": "queued",
        "message": "Audio received. Processing started."
    }


@router.get("/task/{task_id}")
async def get_task_result(task_id: str):
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