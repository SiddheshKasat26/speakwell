from gtts import gTTS
from config import settings
import os
import uuid

os.makedirs(settings.output_dir, exist_ok=True)

def text_to_speech(text: str, lang: str = "en") -> str:
    """
    Convert corrected text to audio file.
    Returns the file path of the generated audio.
    """
    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(settings.output_dir, filename)
    tts = gTTS(text=text, lang=lang, slow=False)
    tts.save(filepath)
    return filepath