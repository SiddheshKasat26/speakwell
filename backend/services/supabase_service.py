from supabase import create_client, Client
from config import settings
import uuid
import requests

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key
)

BUCKET_NAME = "audio-uploads"

def upload_audio_to_storage(file_bytes: bytes, filename: str) -> str:
    """
    Upload audio file bytes to Supabase Storage.
    Returns the public URL for accessing it.
    """
    unique_filename = f"{uuid.uuid4()}_{filename}"

    supabase.storage.from_(BUCKET_NAME).upload(
        unique_filename,
        file_bytes,
        file_options={"content-type": "audio/webm"}
    )

    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)
    return public_url


def download_audio_from_url(url: str, local_path: str) -> str:
    """
    Download audio from a public URL to a local temp file.
    Whisper needs a local file path to process audio.
    """
    response = requests.get(url, timeout=30)
    response.raise_for_status()

    with open(local_path, "wb") as f:
        f.write(response.content)

    return local_path


def delete_audio_from_storage(filename: str):
    """
    Clean up uploaded file from Supabase Storage after processing.
    """
    try:
        supabase.storage.from_(BUCKET_NAME).remove([filename])
    except Exception as e:
        print(f"[Storage] Failed to delete {filename}: {e}")


def save_session(session_data: dict) -> dict:
    response = (
        supabase
        .table("sessions")
        .insert(session_data)
        .execute()
    )
    return response.data[0] if response.data else {}


def get_user_sessions(user_id: str, limit: int = 20) -> list:
    response = (
        supabase
        .table("sessions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []