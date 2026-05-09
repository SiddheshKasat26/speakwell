from fastapi import APIRouter, UploadFile, File, HTTPException
from services.pipeline import run_full_pipeline
import shutil
import uuid
import os

router = APIRouter()

UPLOAD_DIR = "uploaded_audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
    temp_path = os.path.join(UPLOAD_DIR, temp_filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run pipeline
    result = run_full_pipeline(temp_path)
    return result