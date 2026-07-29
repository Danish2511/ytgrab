# Reel — self-hosted video/audio grabber (Python + FastAPI + yt-dlp)

Paste a YouTube link, pick a resolution or grab audio as MP3, download the file. One FastAPI app serves both the API and the single-page frontend — no separate frontend build, no accounts, nothing stored after your download finishes.

This is a rebuild of the original Next.js version using `yt-dlp` instead of a JS scraping library. `yt-dlp` is the most actively maintained tool of its kind — it ships fixes within days when YouTube changes something, which the Node-based libraries often lag behind on.

## ⚠️ Before you deploy

Downloading YouTube videos can conflict with YouTube's Terms of Service depending on the content and what you do with it. Use this for videos you own, Creative Commons / public domain content, or personal backups of your own uploads — not for redistributing copyrighted material. You're responsible for how you use this once it's hosted under your name.

## How it works

- `main.py` — a FastAPI app with two endpoints:
  - `GET /api/info?url=...` — uses `yt-dlp` to read the video's metadata and available resolutions, returns JSON.
  - `GET /api/download?url=...&type=video|audio&format_id=...` — downloads with `yt-dlp`, which handles all the muxing (combining a video-only stream with the best audio track) and MP3 conversion internally via `ffmpeg`. The file streams back, then gets deleted from the server automatically.
- `static/index.html` — the entire frontend: plain HTML/CSS/JS, no build step, no framework. FastAPI serves it directly.
- `imageio-ffmpeg` bundles a working `ffmpeg` binary for whichever OS you're on (Windows/Mac/Linux), so there's no separate ffmpeg install step and no npm-style install-script headaches.

## Run it locally

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
uvicorn main:app --reload
```

Open http://localhost:8000.

## Deploying

Python + `yt-dlp` + `ffmpeg` wants a real, long-lived server process — not Vercel's serverless functions, which aren't a good fit here (short execution limits, awkward binary support). Use one of these instead, all of which run the included `Dockerfile` with no changes needed:

### Render
1. Push this repo to GitHub.
2. **New → Web Service** → connect the repo → Render auto-detects the `Dockerfile`.
3. Deploy. No environment variables required.

### Railway
1. Push this repo to GitHub.
2. **New Project → Deploy from GitHub repo** → Railway detects the `Dockerfile` automatically.
3. Deploy.

### Fly.io
```bash
fly launch     # detects the Dockerfile, follow the prompts
fly deploy
```

All three give you a free tier that's enough for personal use.

## Notes on quality options

YouTube stores resolutions above 720p as separate video and audio streams — `yt-dlp`'s `format_id+bestaudio` syntax (used in `main.py`) fetches both and merges them with `ffmpeg` automatically, so every resolution just works from the UI without any extra logic.

## Tech stack

FastAPI · `yt-dlp` · `ffmpeg` (via `imageio-ffmpeg`) · vanilla HTML/CSS/JS frontend
