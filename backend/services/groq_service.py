from groq import Groq
from config import settings
import json

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

Return ONLY valid JSON. No markdown, no explanation outside JSON.
"""

def analyze_transcript(transcript: str) -> dict:
    """
    Send transcript to Groq ( Llama 3 ) for analysis and correction.
    """
    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this transcript:\n\n{transcript}"}
        ],
        temperature=0.3, # lower = more consistent, less creative
        max_tokens= 1000
    )
    raw = response.choices[0].message.content
    return json.loads(raw)