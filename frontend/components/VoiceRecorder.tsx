"use client";

import { useState, useRef } from "react";

interface VoiceRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onRecordingComplete(blob);
      // Stop microphone stream
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
    setIsRecording(true);

    // Timer
    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-24 h-24 rounded-full text-white font-bold text-sm transition-all duration-200 shadow-lg
          ${isRecording
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : "bg-blue-600 hover:bg-blue-700"
          }`}
      >
        {isRecording ? "STOP" : "SPEAK"}
      </button>

      {isRecording && (
        <p className="text-red-500 font-mono text-lg">
          ● Recording... {recordingTime}s
        </p>
      )}
    </div>
  );
}