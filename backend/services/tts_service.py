from gtts import gTTS
from config import settings
from services.supabase_service import supabase, BUCKET_NAME
import uuid
import os
import io

def text_to_speech(text: str, lang: str = "en") -> str:
    """
    Convert text to speech and upload to Supabase Storage.
    Returns the public URL of the generated audio.
    """
    filename = f"generated_{uuid.uuid4()}.mp3"

    # Generate audio to bytes buffer instead of local file
    tts = gTTS(text=text, lang=lang, slow=False)
    audio_buffer = io.BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)
    audio_bytes = audio_buffer.read()

    # Upload to Supabase Storage
    supabase.storage.from_(BUCKET_NAME).upload(
        filename,
        audio_bytes,
        file_options={"content-type": "audio/mpeg"}
    )

    # Return public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
    return public_url


def generate_dual_audio(corrected_text: str, natural_text: str) -> dict:
    """
    Generate TTS for both corrected and natural versions.
    Returns dict with both public URLs.
    """
    corrected_url = text_to_speech(corrected_text)
    natural_url = text_to_speech(natural_text)
    return {
        "corrected": corrected_url,
        "natural": natural_url
    }