import librosa
import numpy as np
import os
import tempfile
from groq import Groq
from config import settings

# Groq client — same one used for grammar analysis
client = Groq(api_key=settings.groq_api_key)

# Known Whisper hallucination phrases
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
    Runs locally — cheap check before sending to API.
    """
    try:
        audio, sr = librosa.load(file_path, sr=16000, mono=True)
        rms = np.sqrt(np.mean(audio ** 2))
        print(f"[Whisper] Audio RMS energy: {rms:.4f} (threshold: {threshold})")
        return float(rms) > threshold
    except Exception as e:
        print(f"[Whisper] Energy check failed: {e}")
        return True  # if check fails, let API decide


def is_hallucinated(text: str) -> bool:
    """Secondary check — catch known hallucination phrases."""
    text_lower = text.lower().strip()
    return any(phrase in text_lower for phrase in HALLUCINATION_PHRASES)


def transcribe_audio(file_path: str) -> dict:
    """
    Transcribe audio using Groq's hosted Whisper API.
    No model loaded locally — sends audio to Groq's GPU servers.
    Returns same dict structure as before so pipeline is unchanged.
    """
    # Stage 1 — Energy check (local, cheap)
    if not has_real_speech(file_path):
        print("[Whisper] Silence detected — skipping transcription")
        return {
            "text": "",
            "language": "en",
            "segments": [],
            "raw_words": [],
            "hallucinated": True,
        }

    # Stage 2 — Send to Groq's Whisper API
    print("[Whisper] Sending audio to Groq Whisper API...")
    try:
        with open(file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=("recording.webm", audio_file.read(), "audio/webm"),  # ← explicit name + mime type
                model="whisper-large-v3-turbo",
                response_format="verbose_json",
                language="en",
                prompt=(
                    "The speaker has an Indian accent. "
                    "Common Indian names include Siddhesh, Priya, Raj, Amit. "
                    "Transcribe exactly what is said including grammar mistakes."
                )
            )
    except Exception as e:
        print(f"[Whisper] Groq API error: {e}")
        raise ValueError(f"Transcription failed: {str(e)}")

    text = transcription.text.strip()
    print(f"[Whisper] Transcribed: {text}")

    # Stage 3 — Hallucination check
    if is_hallucinated(text):
        print(f"[Whisper] Hallucination detected: {text}")
        return {
            "text": "",
            "language": "en",
            "segments": [],
            "raw_words": [],
            "hallucinated": True,
        }

    # Extract word-level data for filler detection
    # Groq's verbose_json includes segments with word timestamps
    segments = []
    raw_words = []

    if hasattr(transcription, "segments") and transcription.segments:
        for segment in transcription.segments:
            # Groq returns segments as dicts, not objects
            # Handle both cases defensively
            if isinstance(segment, dict):
                seg_text = segment.get("text", "")
                seg_words = segment.get("words", [])
                seg_dict = {
                    "text": seg_text,
                    "start": segment.get("start", 0),
                    "end": segment.get("end", 0),
                }
                if seg_words:
                    seg_dict["words"] = seg_words
                    raw_words.extend([
                        w.get("word", "").strip().lower()
                        for w in seg_words
                    ])
                else:
                    raw_words.extend(seg_text.strip().lower().split())
            else:
                # Object-style access (fallback)
                seg_dict = {
                    "text": segment.text,
                    "start": segment.start,
                    "end": segment.end,
                }
                if hasattr(segment, "words") and segment.words:
                    seg_dict["words"] = [
                        {"word": w.word, "start": w.start, "end": w.end}
                        for w in segment.words
                    ]
                    raw_words.extend([
                        w.word.strip().lower()
                        for w in segment.words
                    ])
                else:
                    raw_words.extend(segment.text.strip().lower().split())
            segments.append(seg_dict)

    print(f"[Whisper] Raw words: {raw_words}")

    return {
        "text": text,
        "language": getattr(transcription, "language", "en"),
        "segments": segments,
        "raw_words": raw_words,
        "hallucinated": False,
    }