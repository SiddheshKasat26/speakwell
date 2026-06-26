"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserSessions } from "@/services/history";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Session {
  id: string;
  created_at: string;
  original_transcript: string;
  corrected_text: string;
  fluency_score: number;
  clarity_score: number;
  confidence_score: number;
}

function avgScore(s: Session) {
  return Math.round(
    (s.fluency_score + s.clarity_score + s.confidence_score) / 3
  );
}

function HistoryContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Session | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserSessions(user.id)
      .then((data) => setSessions(data ?? []))
      .catch((err) => console.error("Failed to fetch sessions:", err))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Your Progress</h1>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            + New Recording
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <p className="text-gray-400 text-center py-16">
            No sessions yet. Record your first speech!
          </p>
        )}

        {/* Session detail view */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Session Detail</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                    You said
                  </p>
                  <p className="text-gray-700">{selected.original_transcript}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                    Corrected
                  </p>
                  <p className="text-gray-700">{selected.corrected_text}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Fluency", selected.fluency_score],
                    ["Clarity", selected.clarity_score],
                    ["Confidence", selected.confidence_score],
                  ].map(([label, score]) => (
                    <div key={label} className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{score}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session list */}
        <div className="space-y-4">
          {sessions.map((session) => {
            const avg = avgScore(session);
            const color =
              avg >= 70 ? "text-green-600"
              : avg >= 40 ? "text-yellow-600"
              : "text-red-500";

            return (
              <button
                key={session.id}
                onClick={() => setSelected(session)}
                className="w-full bg-white rounded-xl p-5 border shadow-sm
                  hover:shadow-md hover:border-blue-200 transition-all text-left"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-400">
                    {new Date(session.created_at).toLocaleString()}
                  </span>
                  <span className={`text-2xl font-bold ${color}`}>
                    {avg}
                    <span className="text-sm font-normal text-gray-400">/100</span>
                  </span>
                </div>
                <p className="text-gray-700 text-sm line-clamp-2">
                  {session.original_transcript}
                </p>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span>Fluency: {session.fluency_score}</span>
                  <span>Clarity: {session.clarity_score}</span>
                  <span>Confidence: {session.confidence_score}</span>
                </div>
                <p className="text-xs text-blue-400 mt-2">
                  Tap to view details →
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}