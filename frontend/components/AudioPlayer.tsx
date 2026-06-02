"use client";

import { useEffect, useState, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface AudioPlayerProps {
    audioUrl: string;
    label?: string;
}

export default function AudioPlayer({
  audioUrl,
  label = "Play corrected audio",
}: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${audioUrl}`;

  useEffect(() => {
    if (!containerRef.current) return;

    // Create WaveSurfer instance
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#93c5fd",       // blue-300
      progressColor: "#2563eb",   // blue-600
      cursorColor: "#1d4ed8",
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 64,
      normalize: true,
    });

    ws.load(fullUrl);

    ws.on("ready", () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });

    ws.on("audioprocess", () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on("finish", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    wavesurferRef.current = ws;

    return () => ws.destroy();
  }, [fullUrl]);

  const togglePlay = () => {
    if (!wavesurferRef.current || !isReady) return;
    wavesurferRef.current.playPause();
    setIsPlaying((prev) => !prev);
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-xl p-5 border shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4">🔊 {label}</h3>

      {/* Waveform */}
      <div
        ref={containerRef}
        className="w-full bg-blue-50 rounded-lg p-2 mb-3 cursor-pointer"
      />

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all
            ${isReady
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all"
              style={{
                width: duration ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
        </div>

        <span className="text-sm text-gray-500 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {!isReady && (
        <p className="text-xs text-gray-400 mt-2">Loading audio...</p>
      )}
    </div>
  );
}