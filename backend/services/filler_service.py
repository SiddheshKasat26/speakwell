from collections import Counter

# Common filler words and phrases in English speech
# Especially relevant for Indian English speakers
FILLER_WORDS = {
    "um", "uh", "ah", "er", "uhh", "umm", "ahh",
    "like", "basically", "literally", "actually",
    "you know", "i mean", "sort of", "kind of",
    "right", "okay", "so", "well", "anyway",
    "and", "but", # when repeated excessively
}

# Words that are fillers only when repeated — not naturally
REPETITION_FILLERS = {"and", "but", "so", "like", "okay", "right"}

def detect_fillers(raw_words: list, repetition_threshold: int = 3) -> list:
    """
    Detect filler words from raw word list extracted from Whisper segments.
    
    Two detection strategies:
    1. Direct fillers — words always considered filler (um, uh, etc.)
    2. Repetition fillers — words that become filler when repeated too much
    
    Returns list of {word, count} sorted by count descending.
    """
    if not raw_words:
        return []

    word_counts = Counter(raw_words)
    fillers_found = []

    for word, count in word_counts.items():
        word_clean = word.strip(".,!?").lower()

        # Always a filler
        if word_clean in FILLER_WORDS - REPETITION_FILLERS:
            if count >= 1:
                fillers_found.append({
                    "word": word_clean,
                    "count": count
                })

        # Only a filler if repeated above threshold
        elif word_clean in REPETITION_FILLERS:
            if count >= repetition_threshold:
                fillers_found.append({
                    "word": word_clean,
                    "count": count
                })

    # Sort by count — worst offenders first
    fillers_found.sort(key=lambda x: x["count"], reverse=True)
    return fillers_found