import axios from "axios";
import { PipelineResult } from "@/types/analysis";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Temporary test user
const TEST_USER_ID = "4b9548d5-5659-4bc6-8331-4990e86ca706";

export async function analyzeAudio(audioBlob: Blob): Promise<PipelineResult> {
    const formData = new FormData();

    // Convert blob to file — FastAPI expects a named file
    const audioFile = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
    });
    formData.append("file", audioFile);
    formData.append("user_id", TEST_USER_ID); // ← backend saves session

    const response = await api.post<PipelineResult>(
        "/api/audio/analyze",
        formData,
        {
            headers: { "Content-Type": "multipart/form-data"},
        }
    );

    return response.data;
}