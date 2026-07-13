# SpeakWell — AI English Speaking Coach

<div align="center">

**Record yourself speaking. Get instant AI feedback. Improve faster.**

🌐 [speakwell-pi.vercel.app](https://speakwell-pi.vercel.app) · [Report a Bug](https://github.com/iamsiddhesh-dev/speakwell/issues) · [Request a Feature](https://github.com/iamsiddhesh-dev/speakwell/issues)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

</div>

---

## What Is SpeakWell?

SpeakWell is a full-stack AI-powered English speaking coach. You record yourself speaking — even with mistakes — and within seconds you get:

- **Grammar corrections** with clear explanations for each mistake
- **Filler word detection** — catches overused words like "so", "like", "basically"
- **Fluency, clarity, and confidence scores** out of 100
- **A corrected version** of what you said, read back to you in audio
- **A natural native-speaker version** — how a fluent speaker would phrase it
- **Waveform audio players** for your original recording, corrected version, and natural version side by side
- **Session history** — every practice session is saved so you can track improvement over time

---

## Live Demo

> 🌐 [https://speakwell-live.vercel.app](https://speakwell-live.vercel.app)

Sign up with any email → click SPEAK → record yourself → get feedback in 10-15 seconds.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│               https://speakwell-pi.vercel.app                │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend)                        │
│                        Next.js 16                            │
│    Voice Recorder │ Dashboard UI │ Auth UI │ History Page    │
└───────────────────────────┬──────────────────────────────────┘
                            │ REST API + polling
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    RAILWAY (Backend)                         │
│                                                              │
│  ┌──────────────────┐         ┌───────────────────────────┐  │
│  │   FastAPI        │         │     Celery Worker         │  │
│  │   API Gateway    │──Redis─▶│   AI Processing Pipeline  │  │
│  │   Port 8000      │         │                           │  │
│  └──────────────────┘         │  1. Groq Whisper (STT)    │  │
│                               │  2. RMS energy check      │  │
│                               │  3. Groq Llama (analysis) │  │
│                               │  4. gTTS (text-to-speech) │  │
│                               │  5. Supabase session save │  │
│                               └───────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
           ┌────────────────┼─────────────────┐
           ▼                ▼                  ▼
┌───────────────┐  ┌────────────────┐  ┌──────────────────────┐
│   Supabase    │  │   Supabase     │  │      Groq API        │
│  PostgreSQL   │  │   Storage      │  │                      │
│               │  │                │  │  whisper-large-v3    │
│  · Users      │  │  · Uploads     │  │  llama-3.3-70b       │
│  · Sessions   │  │  · Generated   │  │                      │
│  · Profiles   │  │    audio       │  │                      │
└───────────────┘  └────────────────┘  └──────────────────────┘
```

### Request Flow

1. User records audio in browser via `MediaRecorder` API
2. Frontend uploads audio blob to FastAPI → audio stored in Supabase Storage
3. FastAPI queues a Celery task and returns `task_id` immediately (< 200ms)
4. Celery worker picks up task from Redis queue
5. Worker downloads audio from Supabase Storage to `/tmp/`
6. RMS energy check rejects silence before calling any AI
7. Groq Whisper transcribes audio (~0.2s on Groq's GPU)
8. Groq Llama analyzes transcript — grammar, fillers, scores, corrections
9. gTTS generates two audio files → uploaded to Supabase Storage
10. Session saved to Supabase PostgreSQL
11. Frontend polls `GET /api/audio/task/{id}` every 2 seconds until done
12. Results rendered — transcript, scores, corrections, three audio players

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 + TypeScript | React framework with App Router |
| Tailwind CSS | Utility-first styling |
| WaveSurfer.js | Audio waveform visualization |
| Supabase JS | Auth client + database queries |
| Axios | HTTP client with JWT interceptor |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | Async REST API gateway |
| Celery | Distributed task queue |
| Redis | Message broker + result backend |
| Pydantic Settings | Centralized config management |
| gTTS | Text-to-speech generation |
| Librosa | RMS energy detection (silence guard) |

### AI Services
| Service | Model | Purpose |
|---|---|---|
| Groq | whisper-large-v3-turbo | Speech to text (< 1s) |
| Groq | llama-3.3-70b-versatile | Grammar analysis + corrections |

### Infrastructure
| Technology | Purpose |
|---|---|
| Vercel | Frontend hosting + CDN |
| Railway | Backend + Celery worker + Redis |
| Supabase | PostgreSQL + Storage + Auth |
| Docker + Docker Compose | Local development orchestration |

---

## Known Limitations

- Short disfluencies like "um" and "uh" are frequently dropped by Whisper during transcription, limiting filler detection accuracy for those specific words
- Text-to-speech uses gTTS which produces a synthetic voice rather than natural or cloned speech
- No GPU acceleration — processing runs on CPU-only Railway containers
- No email verification or password reset flow currently implemented
- Mobile app (React Native) not yet built
- History page loads all sessions at once — no pagination for large histories

---

## What I Learned Building This

This project was built as a learning exercise covering the full stack from scratch:

- Designing async architectures with Celery + Redis for long-running AI tasks
- Debugging distributed systems where backend and worker run in separate containers
- Managing secrets and environment variables across local, Docker, and production environments
- Docker multi-stage builds for minimal production images
- Implementing JWT-based auth with Supabase and protecting routes in Next.js App Router
- Using Pydantic BaseSettings for centralized, type-safe configuration
- Git Flow branching strategy with feature branches, PRs, and semantic commits
