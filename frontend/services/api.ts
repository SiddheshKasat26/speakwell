import axios from "axios";
import { PipelineResult } from "@/types/analysis";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export async function analyzeAudio(audioBlob: Blob): Promise<PipelineResult> {
    const formData = new FormData();

    // Convert blob to file — FastAPI expects a named file
    const audioFile = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
    });
    formData.append("file", audioFile);

    const response = await api.post<PipelineResult>(
        "/api/audio/analyze",
        formData,
        {
            headers: { "Content-Type": "multipart/form-data"},
        }
    );

    return response.data;
}