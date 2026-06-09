from supabase import create_client, Client
from config import settings

# Single client instance — created once at startup
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key
)

def save_session(session_data: dict) -> dict:
    """
    Save analysis session to Supabase.
    Uses service key — bypasses RLS safely from backend only.
    Returns the saved row including its generated id.
    """
    response = (
        supabase
        .table("sessions")
        .insert(session_data)
        .execute()
    )
    return response.data[0] if response.data else {}

def get_user_sessions(user_id: str, limit: int = 20) -> list:
    """
    Fetch recent sessions for a user, newest first.
    """
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