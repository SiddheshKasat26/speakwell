import whisper
import librosa
import numpy as np
from config import settings

# Don't load at import time — load on first use
_model = None

def get_model():
    global _model
    if _model is None:
        print(f"[Whisper] Loading model: {settings.whisper_model}")
        _model = whisper.load_model(settings.whisper_model)
    return _model

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
        rms = np.sqrt(np.mean(audio**2))
        print(f"[Whisper] Audio RMS energy: {rms:.4f} (threshold: {threshold})")

        return float(rms) > threshold

    except Exception as e:
        print(f"[Whisper] Energy check failed: {e}")
        return True  # if check fails, let Whisper decide


def extract_words_from_segments(segments: list) -> list:
    """
    Extract individual words from Whisper segments.
    Segments contain more raw data than the final transcript
    including repeated words that get collapsed in the final text.
    """
    words = []
    for segment in segments:
        # Each segment has a 'words' list if word_timestamps=True
        if "words" in segment:
            for word_data in segment["words"]:
                words.append(word_data["word"].strip().lower())
        else:
            # Fallback — split segment text into words
            segment_words = segment.get("text", "").strip().split()
            words.extend([w.lower() for w in segment_words])
    return words


def is_hallucinated(text: str) -> bool:
    """
    Secondary check — catch hallucinations that slipped past energy detection.
    Keeps a list of known Whisper hallucination patterns.
    """
    text_lower = text.lower().strip()
    return any(phrase in text_lower for phrase in HALLUCINATION_PHRASES)


def transcribe_audio(file_path: str) -> dict:
    if not has_real_speech(file_path):
        print("[Whisper] Silence detected — skipping transcription")
        return {
            "text": "",
            "language": "en",
            "segments": [],
            "raw_words": [],
            "hallucinated": True,
        }
    
    model = get_model() # ← load on demand, not at startup

    result = model.transcribe(
        file_path,
        language="en",
        task="transcribe",
        initial_prompt=INITIAL_PROMPT,
        fp16=False,
        temperature=0.0,
        best_of=1,
        beam_size=5,
        word_timestamps=True, # ← request word-level timing
    )

    text = result["text"].strip()
    print(f"[Whisper] Transcribed: {text}")

    if is_hallucinated(text):
        print(f"[Whisper] Hallucination detected: {text}")
        return {
            "text": "",
            "language": "en",
            "segments": [],
            "raw_words": [],
            "hallucinated": True,
        }

    raw_words = extract_words_from_segments(result.get("segments", []))
    print(f"[Whisper] Raw words: {raw_words}")

    return {
        "text": text,
        "language": result.get("language", "en"),
        "segments": result.get("segments", []),
        "raw_words": raw_words, # ← word list before collapsing
        "hallucinated": False,
    }
