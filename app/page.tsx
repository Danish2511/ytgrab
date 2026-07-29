"use client";

import { useState } from "react";

type VideoFormat = {
  itag: number;
  qualityLabel: string;
  container: string;
  hasAudio: boolean;
  approxSizeMB: number | null;
};

type FormatsResponse = {
  title: string;
  author: string;
  thumbnail: string;
  durationSec: number;
  videoFormats: VideoFormat[];
  bestAudioItag: number;
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormatsResponse | null>(null);
  const [downloadingItag, setDownloadingItag] = useState<number | null>(null);

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/formats?url=${encodeURIComponent(url.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't read that link.");
      setData(json);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(kind: "video" | "audio", itag: number) {
    if (!data) return;
    setDownloadingItag(itag);
    try {
      const res = await fetch(
        `/api/download?url=${encodeURIComponent(url.trim())}&type=${kind}&itag=${itag}`
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Download failed.");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : kind === "audio" ? "audio.mp3" : "video.mp4";
      const link = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      link.href = objUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objUrl);
    } catch (err: any) {
      setError(err.message || "Download failed.");
    } finally {
      setDownloadingItag(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      {/* Signature: VU meter mark instead of a generic icon */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-6 items-end gap-[3px]">
          <span className="vu-bar h-[30%] animate-bar1" />
          <span className="vu-bar h-[60%] animate-bar2" />
          <span className="vu-bar h-[45%] animate-bar3" />
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-mist">Reel</span>
      </div>

      <h1 className="font-display text-4xl font-medium leading-[1.1] text-paper sm:text-5xl">
        Paste a link, pick a quality,
        <br />
        <span className="text-amber">keep the file.</span>
      </h1>
      <p className="mt-4 max-w-xl text-mist">
        Drop in a YouTube URL. Choose a video resolution or grab just the audio as an MP3.
        Everything runs on your own server — nothing is stored after your download finishes.
      </p>

      <form onSubmit={handleFetch} className="mt-10 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="focus-ring flex-1 rounded-lg border border-line bg-panel px-4 py-3 font-mono text-sm text-paper placeholder:text-mist/60"
        />
        <button
          type="submit"
          disabled={loading}
          className="focus-ring rounded-lg bg-amber px-6 py-3 font-medium text-ink transition hover:bg-amber2 disabled:opacity-50"
        >
          {loading ? "Reading…" : "Find formats"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-10 flex items-center gap-3 text-mist">
          <div className="flex h-5 items-end gap-[3px]">
            <span className="vu-bar h-[30%] animate-bar1" />
            <span className="vu-bar h-[60%] animate-bar2" />
            <span className="vu-bar h-[45%] animate-bar3" />
          </div>
          <span className="font-mono text-xs">reading stream info…</span>
        </div>
      )}

      {data && (
        <div className="animate-rise mt-12">
          <div className="flex gap-4 rounded-xl border border-line bg-panel p-4">
            <img
              src={data.thumbnail}
              alt={data.title}
              className="h-24 w-40 flex-shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg text-paper">{data.title}</h2>
              <p className="mt-1 text-sm text-mist">{data.author}</p>
              <p className="mt-1 font-mono text-xs text-mist">
                {formatDuration(data.durationSec)}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-mist">
              Video — pick a resolution
            </h3>
            <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-panel">
              {data.videoFormats.map((f) => (
                <div key={f.itag} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="font-medium text-paper">{f.qualityLabel}</span>
                    <span className="ml-2 font-mono text-xs text-mist">
                      {f.container.toUpperCase()}
                      {f.approxSizeMB ? ` · ~${f.approxSizeMB} MB` : ""}
                      {!f.hasAudio ? " · muxed with audio on download" : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload("video", f.itag)}
                    disabled={downloadingItag !== null}
                    className="focus-ring rounded-md border border-amber/40 px-4 py-1.5 text-sm text-amber transition hover:bg-amber hover:text-ink disabled:opacity-40"
                  >
                    {downloadingItag === f.itag ? "Preparing…" : "Download"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-mist">
              Audio only
            </h3>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3">
              <div>
                <span className="font-medium text-paper">MP3, 192 kbps</span>
                <span className="ml-2 font-mono text-xs text-mist">converted on the server</span>
              </div>
              <button
                onClick={() => handleDownload("audio", data.bestAudioItag)}
                disabled={downloadingItag !== null}
                className="focus-ring rounded-md border border-amber/40 px-4 py-1.5 text-sm text-amber transition hover:bg-amber hover:text-ink disabled:opacity-40"
              >
                {downloadingItag === data.bestAudioItag ? "Converting…" : "Download MP3"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-20 border-t border-line pt-6 font-mono text-xs text-mist/70">
        Only download content you have the rights to use. This tool runs entirely on
        infrastructure you control.
      </footer>
    </main>
  );
}
