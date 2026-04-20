from fastapi import APIRouter, UploadFile, File
from schemas.audio import AnalysisResponse

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_audio(file: UploadFile = File(...)):
    """
    Accepts an audio file and returns analysis.
    AI processing will be wired in Milestone 3.
    """
    return AnalysisResponse(
        task_id="placeholder-123",
        status="queued",
        message=f"Received file: {file.filename}"
    )