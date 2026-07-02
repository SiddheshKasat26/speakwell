from config import settings
from services.whisper_service import transcribe_audio
from services.groq_service import analyze_transcript
from services.tts_service import generate_dual_audio
from services.supabase_service import save_session
from services.filler_service import detect_fillers


def run_full_pipeline(audio_file_path: str, user_id: str = None) -> dict:
    """
    Full pipeline:
    1. Transcribe audio (Whisper)
    2. Analyze + correct (Groq)
    3. Generate two TTS audio files
    4. Save session to Supabase
    5. Return complete result
    """

    # Stage 1 — Speech to text
    print("[Pipeline] Stage 1: Transcribing...")
    transcription = transcribe_audio(audio_file_path)

    # Guard — catch empty transcription early or hallucinated transcription
    transcript_text = transcription["text"].strip()

    if transcription.get("hallucinated"):
        raise ValueError("No real speech detected. Please speak clearly and try again.")

    if not transcript_text or len(transcript_text) < 5:
        raise ValueError(
            "Could not transcribe audio. Please speak clearly and try again."
        )

    print(f"[Pipeline] Transcript: {transcript_text}")

    # Detect fillers from raw words — before Groq collapses them
    raw_words = transcription.get("raw_words", [])
    detected_fillers = detect_fillers(raw_words)
    print(f"[Pipeline] Fillers detected: {detected_fillers}")

    # Stage 2 — AI analysis
    # Pass detected fillers to Groq so it doesn't re-detect from cleaned text
    print("[Pipeline] Stage 2: Analyzing with Groq...")
    analysis = analyze_transcript(
        transcript_text, detected_fillers
    )  # ← use validated text

    # Stage 3 — Generate both audio versions
    print("[Pipeline] Stage 3: Generating audio...")

    corrected_text = analysis.get("corrected_text", "")
    natural_text = analysis.get("natural_version", "") or analysis.get("natural_text", "")

    if not corrected_text:
        raise ValueError("Groq returned empty corrected_text")

    audio_urls = generate_dual_audio(
        corrected_text=corrected_text,
        natural_text=natural_text if natural_text else corrected_text,
    )

    # URLs are now full Supabase Storage URLs
    corrected_audio_url = audio_urls["corrected"]
    natural_audio_url = audio_urls["natural"]

    # Stage 4 — Save to Supabase (only if user_id provided)
    print("[Pipeline] Stage 4: Saving session...")
    session_id = None
    if user_id:
        try:
            saved = save_session(
                {
                    "user_id": user_id,
                    "original_transcript": transcription["text"],
                    "corrected_text": analysis["corrected_text"],
                    "natural_version": analysis["natural_version"],
                    "fluency_score": analysis["scores"]["fluency"],
                    "clarity_score": analysis["scores"]["clarity"],
                    "confidence_score": analysis["scores"]["confidence"],
                    "grammar_errors": analysis["grammar_errors"],
                    "filler_words": analysis["filler_words"],
                    "audio_url": corrected_audio_url,
                    "natural_audio_url": natural_audio_url,
                }
            )
            session_id = saved.get("id")
        except Exception as e:
            # Don't fail the whole pipeline if save fails
            print(f"[Pipeline] Warning: failed to save session: {e}")

    return {
        "session_id": session_id,
        "original_transcript": transcription["text"],
        "analysis": analysis,
        "corrected_audio_url": corrected_audio_url,
        "natural_audio_url": natural_audio_url,
    }
