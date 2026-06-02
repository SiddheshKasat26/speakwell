import os
from config import settings
from services.whisper_service import transcribe_audio
from services.groq_service import analyze_transcript
from services.tts_service import text_to_speech

def run_full_pipeline(audio_file_path: str) -> dict:
    """
    Full pipeline:
    1. Transcribe audio -> text (Whisper)
    2. Analyze + correct text (Groq/Llama)
    3. Convert corrected text -> audio (gTTS)
    Returns complete analysis result.
    """
    # Stage 1: Speech to Text
    print("[Pipeline] Stage 1: Transcribing audio...")
    transcription = transcribe_audio(audio_file_path)

    # Stage 2: AI Analysis
    print("[Pipeline] Stage 2: Analyzing with Groq...")
    analysis = analyze_transcript(transcription["text"])

    # Stage 3: Text to Speech
    print("[Pipeline] Stage 3: Generating corrected audio...")
    corrected_audio_path = text_to_speech(analysis["corrected_text"])

    # Cleanup uploaded file
    if os.path.exists(audio_file_path):
        os.remove(audio_file_path)

    filename = os.path.basename(corrected_audio_path)

    return {
        "original_transcript": transcription["text"],
        "analysis": analysis,
        "corrected_audio_url": f"/audio/{filename}"
    }