"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoiceRecorder from "@/components/VoiceRecorder";
import AnalysisResults from "@/components/AnalysisResults";
import ProtectedRoute from "@/components/ProtectedRoute";
import { submitAudio, pollTaskResult } from "@/services/api";
import { getUserSessions } from "@/services/history";
import { useAuth } from "@/context/AuthContext";
import { PipelineResult } from "@/types/analysis";

type Status = "idle" | "processing" | "done" | "error";

function HomeContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [error, setError] = useState("");

  // Load real session count on mount
  useEffect(() => {
    if (user) {
      getUserSessions(user.id).then((sessions) => {
        setSessionCount(sessions.length);
      });
    }
  }, [user]);

  const handleAudioReady = (url: string) => {
    setResult(null);
    setError("");
    setStatus("idle");
    setOriginalAudioUrl(url);
  };

  const handleRecordingComplete = async (blob: Blob) => {
    setStatus("processing");
    setResult(null);
    setError("");

    try {
      const taskId = await submitAudio(blob, user!.id);
      const data = await pollTaskResult(taskId, (status) => {
        console.log("[SpeakWell] Task status:", status);
      });

      setResult(data);
      setStatus("done");
      if (data.session_id) {
        setSessionCount((c) => c + 1);
      }
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong. Is the backend running?";
      setError(detail);
      setStatus("error");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center py-16 px-4">

      {/* Header with user info */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">SpeakWell</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome, {user?.email?.split("@")[0]}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* History link */}
      {sessionCount > 0 && (
        <Link
          href="/history"
          className="text-blue-500 hover:underline text-sm mb-8"
        >
          View your progress ({sessionCount} session{sessionCount > 1 ? "s" : ""}) →
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

      {status === "error" && (
        <p className="mt-6 text-red-500">{error}</p>
      )}

      {status === "done" && result && (
        <AnalysisResults
          result={result}
          originalAudioUrl={originalAudioUrl}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}