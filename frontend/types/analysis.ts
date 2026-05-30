export interface GrammarError {
    original: string;
    correction: string;
    explanation: string;
}

export interface FillerWord {
    word: string;
    count: number;
}

export interface Scores {
    fluency: number;
    clarity: number;
    confidence: number;
}

export interface Analysis {
    grammar_errors: GrammarError[];
    filler_words: FillerWord[];
    corrected_text: string;
    natural_version: string;
    scores: Scores;
    feedback: string;
}

export interface PipelineResult {
    original_transcript: string;
    analysis: Analysis;
    corrected_audio_path: string;
}