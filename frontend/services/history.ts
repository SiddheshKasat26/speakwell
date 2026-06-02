import { supabase } from "@/lib/supabase";
import { PipelineResult } from "@/types/analysis";

export async function saveSession(
  result: PipelineResult,
  userId: string
): Promise<void> {
  const { error } = await supabase.from("sessions").insert({
    user_id: userId,
    original_transcript: result.original_transcript,
    corrected_text: result.analysis.corrected_text,
    natural_version: result.analysis.natural_version,
    fluency_score: result.analysis.scores.fluency,
    clarity_score: result.analysis.scores.clarity,
    confidence_score: result.analysis.scores.confidence,
    grammar_errors: result.analysis.grammar_errors,
    filler_words: result.analysis.filler_words,
    audio_url: result.corrected_audio_url,
  });

  if (error) console.error("Failed to save session:", error);
}

export async function getUserSessions(userId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}