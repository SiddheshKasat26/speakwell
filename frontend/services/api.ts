import axios from "axios";
import { PipelineResult } from "@/types/analysis";
import { supabase } from "@/lib/supabase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export async function submitAudio(
  audioBlob: Blob,
  userId: string
): Promise<string> {
  const formData = new FormData();
  const audioFile = new File([audioBlob], "recording.webm", {
    type: "audio/webm",
  });
  formData.append("file", audioFile);
  formData.append("user_id", userId);   // still sending for now — backend will verify via JWT later

  const response = await api.post<{ task_id: string }>(
    "/api/audio/analyze",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return response.data.task_id;
}

export async function pollTaskResult(
  taskId: string,
  onStatusUpdate?: (status: string) => void
): Promise<PipelineResult> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/audio/task/${taskId}`);
        const { status, result, error } = response.data;

        if (onStatusUpdate) onStatusUpdate(status);

        if (status === "done") {
          clearInterval(interval);
          resolve(result);
        } else if (status === "failed") {
          clearInterval(interval);
          reject(new Error(error || "Processing failed"));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 2000);
  });
}