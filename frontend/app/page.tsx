"use client";

import { useState } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import AnalysisResults from "@/components/AnalysisResults";
import { analyzeAudio } from "@/services/api";
import { PipelineResult } from "@/types/analysis";

type Status = "idle" | "processing" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string>("");

  const handleRecordingComplete = async (blob: Blob) => {
    setStatus("processing");
    setResult(null);
    setError("");

    try {
      const data = await analyzeAudio(blob);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError("Something went wrong. Is the backend running?");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center py-16 px-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">SpeakWell</h1>
      <p className="text-gray-500 mb-12">Your AI-powered English speaking coach</p>

      <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

      {status === "processing" && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Analyzing your speech...</p>
        </div>
      )}

      {status === "error" && (
        <p className="mt-6 text-red-500">{error}</p>
      )}

      {status === "done" && result && (
        <AnalysisResults result={result} />
      )}
    </main>
  );
}