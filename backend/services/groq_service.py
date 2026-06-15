from groq import Groq
from config import settings
import json
import re

client = Groq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = """
You are an expert English language coach.
Analyze the given spoken English transcript and return a JSON response with:
- grammar_errors: list of {original, correction, explanation}
- filler_words: list of {word, count}
- corrected_text: grammatically correct version
- natural_version: how a native speaker would say it
- scores: {fluency: 0-100, clarity: 0-100, confidence: 0-100}
- feedback: one encouraging sentence

CRITICAL: Return ONLY raw JSON. No markdown. No code fences. No backticks.
Start your response with { and end with }
"""


def strip_markdown_fences(text: str) -> str:
    """
    Remove markdown code fences that LLMs add despite instructions.
    Handles ```json ... ``` and ``` ... ``` patterns.
    This is a standard defensive parsing technique.
    """
    # Remove ```json or ``` at start
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    # Remove ``` at end
    text = re.sub(r"\s*```$", "", text.strip())
    return text.strip()


def analyze_transcript(transcript: str, detected_fillers: list = None) -> dict:
    """
    Analyze transcript with Groq.
    Accepts pre-detected fillers from Whisper segments
    so Groq focuses on grammar and natural version only.
    """
    filler_context = ""
    if detected_fillers:
        filler_list = ", ".join(
            f'"{f["word"]}" ({f["count"]} times)' for f in detected_fillers
        )
        filler_context = f"\nPre-detected filler words: {filler_list}"

    try:
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Analyze this transcript:{filler_context}\n\n{transcript}"
                    ),
                },
            ],
            temperature=0.3,
            max_tokens=1000,
        )
        raw = response.choices[0].message.content
        print(f"[Groq Raw Response]: {raw}")

        cleaned = strip_markdown_fences(raw)
        result = json.loads(cleaned)

        # Override Groq's filler detection with our more accurate one
        if detected_fillers is not None:
            result["filler_words"] = detected_fillers

        return result

    except json.JSONDecodeError as e:
        print(f"[Groq ERROR] JSON parse failed: {e}")
        raise ValueError(f"Groq returned invalid JSON: {e}")

    except Exception as e:
        print(f"[Groq ERROR] {type(e).__name__}: {e}")
        raise
