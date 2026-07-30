"""
Run this ONLY for local testing before you push to GitHub/Vercel.
It reuses the exact same FastAPI app from api/index.py and just adds
static file serving for public/, which Vercel handles for you in production.

Start it with:
    uvicorn local_dev:app --reload

Then open http://localhost:8000
"""

from fastapi.staticfiles import StaticFiles

from api.index import app

app.mount("/", StaticFiles(directory="public", html=True), name="public")
