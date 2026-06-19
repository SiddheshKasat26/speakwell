"use client";

export const dynamic = "force-dynamic";  // ← skip static pre-rendering

import { useEffect, useState } from "react";
import { getUserSessions } from "@/services/history";
import Link from "next/link";

// Temporary: hardcoded test user ID ( make sure this matches api.ts exactly )
const TEST_USER_ID = "4b9548d5-5659-4bc6-8331-4990e86ca706"; // same UUID as api.ts

interface Session {
  id: string;
  created_at: string;
  original_transcript: string;
  fluency_score: number;
  clarity_score: number;
  confidence_score: number;
}

function avgScore(s: Session) {
  return Math.round(
    (s.fluency_score + s.clarity_score + s.confidence_score) / 3
  );
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getUserSessions(TEST_USER_ID)
      .then((data) => {
        console.log("Session fetched:", data); // temporary debug log
        setSessions(data ?? []);
      })
      .catch((err) => {
        console.error("Failed to fetch sessions:", err);
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Your Progress</h1>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            + New Recording
          </Link>
        </div>

        {loading && <p className="text-gray-500">Loading history...</p>}

        {!loading && sessions.length === 0 && (
          <p className="text-gray-400 text-center py-16">
            No sessions yet. Record your first speech!
          </p>
        )}

        <div className="space-y-4">
          {sessions.map((session) => {
            const avg = avgScore(session);
            const color =
              avg >= 70
                ? "text-green-600"
                : avg >= 40
                ? "text-yellow-600"
                : "text-red-500";

            return (
              <div
                key={session.id}
                className="bg-white rounded-xl p-5 border shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-400">
                    {new Date(session.created_at).toLocaleString()}
                  </span>
                  <span className={`text-2xl font-bold ${color}`}>
                    {avg}
                    <span className="text-sm font-normal text-gray-400">
                      /100
                    </span>
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
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}