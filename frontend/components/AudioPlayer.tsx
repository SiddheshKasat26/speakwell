"use client";
import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  label?: string;
  isLocalUrl?: boolean;
}

export default function AudioPlayer({
  audioUrl,
  label = "Play audio",
  isLocalUrl = false,
}: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const isDestroyedRef = useRef(false); // useRef not useState — no re-render needed
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1 float
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const fullUrl = isLocalUrl
    ? audioUrl
    : `${process.env.NEXT_PUBLIC_API_URL}${audioUrl}`;

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // Prevent duplicate WaveSurfer instances
    if (wavesurferRef.current) return;

    isDestroyedRef.current = false;

    // Clear any leftover DOM (extra safety)
    containerRef.current.innerHTML = "";

    // Dynamically import WaveSurfer — prevents SSR crash
    // This is the correct pattern for browser-only libraries in Next.js
    let ws: any;
    import("wavesurfer.js").then(({ default: WaveSurfer }) => {
      if (isDestroyedRef.current) return; // component unmounted during import

      ws = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: "#93c5fd",
        progressColor: "#2563eb",
        cursorColor: "#1d4ed8",
        barWidth: 3,
        barGap: 2,
        barRadius: 3,
        height: 64,
        normalize: true,
      });

      ws.load(fullUrl);

      ws.on("ready", () => {
        if (isDestroyedRef.current) return;
        setIsReady(true);
        setDuration(ws.getDuration());
      });

      // timeupdate gives current time as argument — most accurate
      ws.on("timeupdate", (time: number) => {
        if (isDestroyedRef.current) return;
        setCurrentTime(time);
        setProgress(ws.getDuration() ? time / ws.getDuration() : 0);
      });

      ws.on("finish", () => {
        if (isDestroyedRef.current) return;
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      });

      ws.on("error", (err: any) => {
        if (isDestroyedRef.current) return;
        console.warn("[AudioPlayer] WaveSurfer error:", err);
      });

      wavesurferRef.current = ws;
    });

    return () => {
      isDestroyedRef.current = true;
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      // Reset all state on cleanup
      setIsReady(false);
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
    };
  }, [fullUrl]);

  const togglePlay = () => {
    if (!wavesurferRef.current || !isReady) return;
    wavesurferRef.current.playPause();
    setIsPlaying((p) => !p);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
        {label}
      </p>

      {/* WaveSurfer renders into this div */}
      <div
        ref={containerRef}
        className="w-full bg-blue-50 rounded p-2 mb-3 cursor-pointer"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className={`w-9 h-9 rounded-full flex items-center justify-center
            text-white text-sm transition-all
            ${isReady
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Progress bar driven by 0-1 float — more accurate than time math */}
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <span className="text-xs text-gray-400 font-mono min-w-[72px] text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {!isReady && (
        <p className="text-xs text-gray-400 mt-2 animate-pulse">
          Loading audio...
        </p>
      )}
    </div>
  );
}