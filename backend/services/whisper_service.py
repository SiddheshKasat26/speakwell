import whisper
from config import settings

# Load once at startup - loading is slow, inference is fast
model = whisper.load_model(settings.whisper_model)

def transcribe_audio(file_path: str) -> dict:
    """
    Transcribe audio file to text using Whisper.
    Returns transcript and detected language.
    """
    result = model.transcribe(file_path)
    return {
        "text": result["text"].strip(),
        "language": result.get("language", "en"),
        "segments": result.get("segments", []) # word-level timing
    }