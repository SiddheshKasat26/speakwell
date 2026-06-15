import whisper
import librosa
import numpy as np
from config import settings

model = whisper.load_model(settings.whisper_model)

INITIAL_PROMPT = (
    "This is a person practicing English speaking. "
    "The speaker has an Indian accent. "
    "Common names include Indian names like Siddhesh, Priya, Raj, Amit. "
    "Transcribe exactly what is said including any grammar mistakes. "
    "Do not correct grammar. Do not add punctuation that wasn't implied."
)

# Known Whisper hallucination phrases — catch what slips past energy check
HALLUCINATION_PHRASES = [
    "thank you for watching",
    "thanks for watching",
    "thank you for listening",
    "thanks for listening",
    "please subscribe",
    "this is a person",
    "the speaker",
    "transcribe exactly",
    "do not correct",
    "subtitles by",
    "translated by",
    "www.",
    ".com",
]

def has_real_speech(file_path: str, threshold: float = 0.01) -> bool:
    """
    Check if audio file contains real speech using RMS energy.
    
    RMS (Root Mean Square) measures average audio power.
    Silence has RMS near 0. Speech has RMS above threshold.
    
    threshold=0.01 means 1% of maximum possible audio energy.
    Below this = silence or background noise only.
    """
    try:
        # Load audio as numpy array
        # sr=16000 matches Whisper's expected sample rate
        audio, sr = librosa.load(file_path, sr=16000, mono=True)

        # Calculate RMS energy
        rms = np.sqrt(np.mean(audio ** 2))
        print(f"[Whisper] Audio RMS energy: {rms:.4f} (threshold: {threshold})")

        return float(rms) > threshold

    except Exception as e:
        print(f"[Whisper] Energy check failed: {e}")
        return True  # if check fails, let Whisper decide


def is_hallucinated(text: str) -> bool:
    """
    Secondary check — catch hallucinations that slipped past energy detection.
    Keeps a list of known Whisper hallucination patterns.
    """
    text_lower = text.lower().strip()
    return any(phrase in text_lower for phrase in HALLUCINATION_PHRASES)


def transcribe_audio(file_path: str) -> dict:
    # Primary check — is there real audio energy?
    if not has_real_speech(file_path):
        print("[Whisper] Silence detected — skipping transcription")
        return {
            "text": "",
            "language": "en",
            "segments": [],
            "hallucinated": True
        }

    # Run Whisper
    result = model.transcribe(
        file_path,
        language="en",
        task="transcribe",
        initial_prompt=INITIAL_PROMPT,
        fp16=False,
        temperature=0.0,
        best_of=1,
        beam_size=5
    )

    text = result["text"].strip()
    print(f"[Whisper] Transcribed: {text}")

    # Secondary check — hallucination detection
    if is_hallucinated(text):
        print(f"[Whisper] Hallucination detected: {text}")
        return {
            "text": "",
            "language": "en",
            "segments": [],
            "hallucinated": True
        }

    return {
        "text": text,
        "language": result.get("language", "en"),
        "segments": result.get("segments", []),
        "hallucinated": False
    }