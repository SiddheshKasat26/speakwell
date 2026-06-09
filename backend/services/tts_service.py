from gtts import gTTS
from config import settings
import os
import uuid

os.makedirs(settings.output_dir, exist_ok=True)

def text_to_speech(text: str, lang: str = "en") -> str:
    """Convert text to speech. Returns file path."""
    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(settings.output_dir, filename)
    tts = gTTS(text=text, lang=lang, slow=False)
    tts.save(filepath)
    return filepath

def generate_dual_audio(corrected_text: str, natural_text: str) -> dict:
    """
    Generate TTS for both corrected and natural versions.
    Returns dict with both file paths.
    Generates separately so each can be played independently.
    """
    corrected_path = text_to_speech(corrected_text)
    natural_path = text_to_speech(natural_text)
    return {
        "corrected": corrected_path,
        "natural": natural_path
    }