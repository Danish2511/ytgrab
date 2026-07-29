# Reel — self-hosted video/audio grabber

A small Next.js app: paste a YouTube link, pick a resolution or grab audio as MP3, download the file. Runs entirely on your own server — no accounts, no third-party API keys, no data stored after the download completes.

## ⚠️ Before you deploy

Downloading YouTube videos can conflict with YouTube's Terms of Service depending on the content and what you do with it. Use this for videos you own, content that's Creative Commons / public domain, or personal backups of your own uploads — not for redistributing copyrighted material. You're responsible for how you use this once it's hosted under your name.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## How it works

- `app/api/formats/route.ts` — reads a YouTube URL with `@distube/ytdl-core` and returns available video resolutions plus a best-audio option.
- `app/api/download/route.ts` — streams the chosen format to a temp file, and:
  - **Audio**: converts to MP3 (192kbps) with `ffmpeg` (via `ffmpeg-static`, no system install needed).
  - **Video, progressive formats (≤720p)**: streamed directly, already has audio baked in.
  - **Video, higher resolutions**: YouTube serves these as separate video-only and audio-only streams, so the route downloads both and muxes them together with `ffmpeg` before sending the file.
- `app/page.tsx` — the UI: URL input, thumbnail/title preview, a list of quality buttons, and an MP3 button.

## Deploying

### Option A — Render / Railway / Fly.io (recommended)

These platforms run a long-lived Node process, which suits ffmpeg muxing and larger files much better than a serverless function. A `Dockerfile` is included.

1. Push this repo to GitHub.
2. On Render (or Railway/Fly): **New Web Service → connect repo → it will detect the Dockerfile automatically**.
3. No environment variables are required.
4. Deploy. That's it.

### Option B — Vercel

Works well for shorter videos and audio extraction. Keep in mind:

- Vercel's serverless functions have a max execution time and payload size (the `vercel.json` in this repo raises `maxDuration` to 60s on the download route, which requires a **Pro** plan — on the free Hobby plan it's capped around 10s, which may be too short for muxing high-resolution video).
- Very large files can exceed the response size limits of serverless functions.
- If you hit these limits, Option A will be more reliable for anything beyond ~1080p or long videos.

Steps:
1. Push this repo to GitHub.
2. Go to vercel.com → **Add New Project** → import the repo.
3. Leave the defaults (Next.js is auto-detected) and deploy.

## Notes on quality options

YouTube stores video and audio as separate streams for anything above 720p (a platform limitation, not something this app can avoid). The app handles this transparently — pick any resolution and it will fetch and merge the matching audio automatically, but higher resolutions take a little longer to prepare than the instantly-streamed lower ones.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · `@distube/ytdl-core` · `fluent-ffmpeg` + `ffmpeg-static`
