"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import VoiceRecorder from "@/components/VoiceRecorder";
import AnalysisResults from "@/components/AnalysisResults";
import { analyzeAudio } from "@/services/api";
import { PipelineResult } from "@/types/analysis";
import { getUserSessions } from "@/services/history";

type Status = "idle" | "processing" | "done" | "error";
const TEST_USER_ID = "4b9548d5-5659-4bc6-8331-4990e86ca706"; // same UUID everywhere

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string>("");
  const [sessionCount, setSessionCount] = useState(0); // ← track saves
  const [error, setError] = useState("");

  // Load real session count from Supabase on first mount
  useEffect(() => {
    getUserSessions(TEST_USER_ID)
      .then((sessions) => {
        setSessionCount(sessions.length);
      })
      .catch(() => {
        // Silently fail — count stays 0, link stays hidden
        // Not critical enough to show an error
      });
  }, []); // ← empty array means "run once on mount only"

  const handleAudioReady = (url: string) => {
    setResult(null);
    setError(""); // ← clear error immediately when new recording begins
    setStatus("idle");
    setOriginalAudioUrl(url);
  };

  const handleRecordingComplete = async (blob: Blob) => {
    setStatus("processing");
    setResult(null);
    setError("");

    try {
      const data = await analyzeAudio(blob);
      setResult(data);
      setStatus("done");

      // Only increment if session was actually saved
      if (data.session_id) {
        setSessionCount((c) => c + 1);
      }
    } catch (err: any) {
      // Extract the real error message from FastAPI's response
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong. Is the backend running?";
      setError(detail);
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center py-16 px-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">SpeakWell</h1>
      <p className="text-gray-500 mb-3">
        Your AI-powered English speaking coach
      </p>

      {/* Only show history link once at least one session is saved */}
      {sessionCount > 0 && (
        <Link
          href="/history"
          className="text-blue-500 hover:underline text-sm mb-8"
        >
          View your progress ({sessionCount} session
          {sessionCount > 1 ? "s" : ""}) →
        </Link>
      )}

      {sessionCount === 0 && <div className="mb-8" />}

      <VoiceRecorder
        onRecordingComplete={handleRecordingComplete}
        onAudioReady={handleAudioReady}
      />

      {status === "processing" && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Analyzing your speech...</p>
        </div>
      )}

      {status === "error" && <p className="mt-6 text-red-500">{error}</p>}

      {status === "done" && result && (
        <AnalysisResults result={result} originalAudioUrl={originalAudioUrl} />
      )}
    </main>
  );
}
