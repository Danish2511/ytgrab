import glob
import os
import re
import tempfile
import uuid

import imageio_ffmpeg
import yt_dlp
from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse

app = FastAPI(title="Reel")

FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
TMP_DIR = tempfile.gettempdir()

CLIENT_ARGS = {"youtube": {"player_client": ["android", "web"]}}


def sanitize(name: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", name or "download").strip()
    return cleaned[:80] or "download"


@app.get("/api/info")
def get_info(url: str = Query(...)):
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Couldn't read that video. It may be private, age-restricted, or unavailable.",
        )

    formats = info.get("formats", []) or []
    seen_labels = set()
    video_formats = []
    for f in sorted(formats, key=lambda f: f.get("height") or 0, reverse=True):
        height = f.get("height")
        if not height or f.get("vcodec") in (None, "none"):
            continue
        label = f"{height}p"
        if label in seen_labels:
            continue
        seen_labels.add(label)

        size = f.get("filesize") or f.get("filesize_approx")
        video_formats.append(
            {
                "formatId": f["format_id"],
                "qualityLabel": label,
                "ext": f.get("ext"),
                "hasAudio": f.get("acodec") not in (None, "none"),
                "approxSizeMB": round(size / 1e6, 1) if size else None,
            }
        )
        if len(video_formats) >= 8:
            break

    return {
        "title": info.get("title"),
        "author": info.get("uploader") or info.get("channel"),
        "thumbnail": info.get("thumbnail"),
        "durationSec": info.get("duration") or 0,
        "videoFormats": video_formats,
    }


@app.get("/api/download")
def download(
    background_tasks: BackgroundTasks,
    url: str = Query(...),
    type: str = Query(..., pattern="^(video|audio)$"),
    format_id: str = Query(""),
):
    job_id = str(uuid.uuid4())
    outtmpl = os.path.join(TMP_DIR, f"{job_id}.%(ext)s")

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "outtmpl": outtmpl,
        "ffmpeg_location": FFMPEG_PATH,
        "extractor_args": CLIENT_ARGS,
    }

    if type == "audio":
        ydl_opts["format"] = "bestaudio/best"
        ydl_opts["postprocessors"] = [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ]
        final_ext = "mp3"
    else:
        if not format_id:
            raise HTTPException(status_code=400, detail="Missing format_id.")
        ydl_opts["format"] = f"{format_id}+bestaudio/best"
        ydl_opts["merge_output_format"] = "mp4"
        final_ext = "mp4"

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Download failed — it may have been too large to finish within the free plan's time limit. Try a lower quality, audio-only, or a shorter video.",
        )

    matches = glob.glob(os.path.join(TMP_DIR, f"{job_id}.{final_ext}"))
    if not matches:
        matches = glob.glob(os.path.join(TMP_DIR, f"{job_id}.*"))
    if not matches:
        raise HTTPException(status_code=500, detail="Download finished but the file went missing.")

    filepath = matches[0]
    title = sanitize(info.get("title", "download"))
    download_name = f"{title}.{final_ext}"

    def cleanup(path: str):
        if os.path.exists(path):
            os.remove(path)

    background_tasks.add_task(cleanup, filepath)

    media_type = "audio/mpeg" if type == "audio" else "video/mp4"
    return FileResponse(filepath, filename=download_name, media_type=media_type, background=background_tasks)
