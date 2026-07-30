# Reel — Vercel deployment (Python + FastAPI + yt-dlp)

Same app, restructured for Vercel's file-based Python runtime. `api/index.py` becomes a serverless function automatically, and everything in `public/` is served as static files.

## ⚠️ Read this before deploying

- Downloading YouTube videos can conflict with YouTube's Terms of Service depending on the content and use. Stick to videos you own, Creative Commons/public domain content, or personal backups.
- **Vercel's free Hobby plan caps function execution at 10 seconds by default.** `vercel.json` in this project raises that to 60 seconds, the max Hobby allows without extra setup — enough for info lookups and most audio/shorter video downloads, but longer or higher-resolution videos may still time out. If you hit that wall often, either:
  - Enable **Fluid Compute** in your Vercel project settings (Settings → Functions), which can extend Hobby execution up to 300 seconds — check current details at vercel.com/docs/functions/limitations since Vercel adjusts these numbers periodically, or
  - Use the Render/Railway/Fly version instead (the Dockerfile-based one from earlier), which runs as a normal long-lived server with no such cap.

## Project layout

```
api/index.py       — FastAPI app, becomes the /api/* serverless function
public/index.html  — the frontend, served as a static file at /
vercel.json         — routes /api/* to the function, sets maxDuration
requirements.txt    — Python dependencies (Vercel installs these automatically)
```

## Deploy

1. Push this folder to a GitHub repo.
2. Go to vercel.com → **Add New → Project** → import the repo.
3. Leave the framework preset on "Other" — Vercel will detect `api/index.py` and `public/` automatically. No build command needed.
4. Deploy.

## Local development

`local_dev.py` is a small wrapper that reuses the exact same app from `api/index.py` and adds static file serving for local testing (Vercel handles that part automatically in production, so it's not in `api/index.py` itself).

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn local_dev:app --reload
```

Open http://localhost:8000 — you'll see the full app, frontend included, behaving the same way it will once deployed.

## Tech stack

FastAPI · `yt-dlp` · `ffmpeg` (via `imageio-ffmpeg`) · vanilla HTML/CSS/JS frontend · Vercel serverless (Python runtime)
