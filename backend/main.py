from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from fastapi.staticfiles import StaticFiles
from config import settings
from routers import audio

app = FastAPI(
    title=settings.app_name,
    description="AI-powered English speaking coach",
    version="0.1.0"
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated audio files
app.mount("/audio", StaticFiles(directory="generated_audio"), name="audio")

# API routes
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.app_name}