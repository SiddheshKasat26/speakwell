from fastapi import APIRouter, UploadFile, File, HTTPException
from services.pipeline import run_full_pipeline
from config import settings
import shutil
import uuid
import os

router = APIRouter()

os.makedirs(settings.upload_dir, exist_ok=True)

@router.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    """
    Accepts an audio file and returns analysis.
    AI processing will be wired in Milestone 3.
    """
    # Validate file type
    if not file.content_type.startswith("audio/"):
        raise HTTPException(400, "Only audio files are accepted")

    # Save uploaded file temporarily
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(settings.upload_dir, temp_filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run pipeline
    result = run_full_pipeline(temp_path)
    return result