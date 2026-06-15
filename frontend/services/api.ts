import axios from "axios";
import { PipelineResult } from "@/types/analysis";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const TEST_USER_ID = "4b9548d5-5659-4bc6-8331-4990e86ca706";

// Step 1 — Submit audio, get task_id back immediately
export async function submitAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  const audioFile = new File([audioBlob], "recording.webm", {
    type: "audio/webm",
  });
  formData.append("file", audioFile);
  formData.append("user_id", TEST_USER_ID);

  const response = await api.post<{ task_id: string }>(
    "/api/audio/analyze",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return response.data.task_id;
}

// Step 2 — Poll until done, return result
export async function pollTaskResult(
  taskId: string,
  onStatusUpdate?: (status: string) => void
): Promise<PipelineResult> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/audio/task/${taskId}`);
        const { status, result, error } = response.data;

        // Notify parent component of current status
        if (onStatusUpdate) onStatusUpdate(status);

        if (status === "done") {
          clearInterval(interval);
          resolve(result);
        } else if (status === "failed") {
          clearInterval(interval);
          reject(new Error(error || "Processing failed"));
        }
        // if queued or processing — keep polling

      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 2000); // poll every 2 seconds
  });
}