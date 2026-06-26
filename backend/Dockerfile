# Stage 1: Base image
# We use Python 3.11 slim — smaller than full image (~50MB vs ~300MB)
# slim removes documentation, test files, and unused tools
FROM python:3.14-slim

# Stage 2: System dependencies
# ffmpeg is needed by Whisper and pydub for audio processing
# We install it at the OS level, not via pip
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*
# rm -rf /var/lib/apt/lists/* cleans apt cache — keeps image smaller

# Stage 3: Working directory
# All subsequent commands run from /app inside the container
WORKDIR /app

# Stage 4: Install Python dependencies
# Copy requirements FIRST — before copying app code
# This is critical for Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 5: Copy application code
# Copied AFTER dependencies so code changes don't invalidate the dependency cache layer
COPY . .

# Stage 6: Create directories needed at runtime
RUN mkdir -p uploaded_audio generated_audio

# Default command: FastAPI
# This runs when container starts as "backend"
# Overridden to celery command for "worker" in docker-compose.yml
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]