"use client";
import { PipelineResult } from "@/types/analysis";
import AudioPlayer from "./AudioPlayer";

interface Props {
  result: PipelineResult;
  originalAudioUrl: string;    // ← new
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold">{score}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function AnalysisResults({ result, originalAudioUrl }: Props) {
  const { original_transcript, analysis } = result;

  return (
    <div className="w-full max-w-2xl space-y-6 mt-8">

      {/* Original transcript + playback of user's own voice */}
      <div className="bg-gray-50 rounded-xl p-4 border">
        <h3 className="font-semibold text-gray-500 text-xs uppercase mb-2">
          You said
        </h3>
        <p className="text-gray-800 mb-4">{original_transcript}</p>
        <AudioPlayer
          audioUrl={originalAudioUrl}
          label="Your recording"
          isLocalUrl={true}          // ← doesn't need API base URL prefix
        />
      </div>

      {/* Scores */}
      <div className="bg-white rounded-xl p-5 border shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">Your Scores</h3>
        <ScoreBar label="Fluency" score={analysis.scores.fluency} />
        <ScoreBar label="Clarity" score={analysis.scores.clarity} />
        <ScoreBar label="Confidence" score={analysis.scores.confidence} />
      </div>

      {/* Grammar errors */}
      {analysis.grammar_errors.length > 0 && (
        <div className="bg-white rounded-xl p-5 border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">Grammar Corrections</h3>
          <div className="space-y-3">
            {analysis.grammar_errors.map((err, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex gap-2 items-center mb-1">
                  <span className="line-through text-red-500">{err.original}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600 font-semibold">{err.correction}</span>
                </div>
                <p className="text-xs text-gray-500">{err.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corrected + Natural versions with audio */}
      <div className="bg-white rounded-xl p-5 border shadow-sm space-y-5">
        <h3 className="font-bold text-gray-800">Improved Versions</h3>

        <div>
          <span className="text-xs font-semibold uppercase text-blue-500">
            Corrected
          </span>
          <p className="text-gray-800 mt-1 mb-3">{analysis.corrected_text}</p>
          <AudioPlayer
            audioUrl={result.corrected_audio_url}
            label="Listen to corrected version"
            isLocalUrl={false}
          />
        </div>

        <div className="border-t pt-4">
          <span className="text-xs font-semibold uppercase text-purple-500">
            Natural (native speaker)
          </span>
          <p className="text-gray-800 mt-1 mb-3">{analysis.natural_version}</p>
          <AudioPlayer
            audioUrl={result.natural_audio_url}
            label="Listen to natural version"
            isLocalUrl={false}
          />
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 italic">💬 {analysis.feedback}</p>
      </div>

      {/* Filler words */}
      {analysis.filler_words.length > 0 && (
        <div className="bg-white rounded-xl p-5 border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">Filler Words Detected</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.filler_words.map((fw, i) => (
              <span key={i}
                className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                "{fw.word}" × {fw.count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}