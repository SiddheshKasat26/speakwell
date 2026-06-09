from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from services.pipeline import run_full_pipeline
from config import settings
import shutil, uuid, os
from typing import Optional

router = APIRouter()
os.makedirs(settings.upload_dir, exist_ok=True)

@router.post("/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)  # optional until auth is built
):
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
        raise HTTPException(400, f"Max file size is {settings.max_audio_size_mb}MB")

    try:
        result = run_full_pipeline(temp_path, user_id=user_id)
        return result
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(500, f"Pipeline failed: {str(e)}")