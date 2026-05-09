from gtts import gTTS
import os
import uuid

OUTPUT_DIR = "generated_audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def text_to_speech(text: str, lang: str = "en") -> str:
    """
    Convert corrected text to audio file.
    Returns the file path of the generated audio.
    """
    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    tts = gTTS(text=text, lang=lang, slow=False)
    tts.save(filepath)

    return filepath