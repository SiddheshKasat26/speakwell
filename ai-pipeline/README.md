# AI Pipeline Service

This directory is reserved for a future standalone AI microservice.

Currently the AI pipeline lives in backend/services/ and is called
via Celery background tasks. When the system needs to scale the AI
processing independently, it will be extracted here as a separate
FastAPI or gRPC service.

Services to extract:
- Whisper STT (whisper_service.py)
- Groq analysis (groq_service.py)  
- TTS generation (tts_service.py)
- Filler detection (filler_service.py)
