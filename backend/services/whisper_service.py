import whisper
from config import settings

# Load once at startup - loading is slow, inference is fast
model = whisper.load_model(settings.whisper_model)

def transcribe_audio(file_path: str) -> dict:
    """
    Transcribe audio file to text using Whisper.
    Returns transcript and detected language.
    """
    result = model.transcribe(
        file_path,
        language="en",
        task="transcribe",
        initial_prompt=(
            "The speaker is an Indian person learning English and may have an Indian accent."
            "Transcribe exactly what is spoken, including grammar mistakes."
            "Pay special attention to proper nouns and Indian names such as Siddhesh, Priya, Raj, Amit."
            "Always transcribe names accurately as spoken, even if they sound unfamiliar."
        ),
        fp16= False, # prevents the FP16 warning on CPU
        temperature=0.0, # deterministic — no randomness in transcription
        best_of=1,
        beam_size=5 # more beams = more accurate, slightly slower
    )
    return {
        "text": result["text"].strip(),
        "language": result.get("language", "en"),
        "segments": result.get("segments", []) # word-level timing
    }