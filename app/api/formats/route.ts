import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !ytdl.validateURL(url)) {
    return NextResponse.json({ error: "That doesn't look like a valid YouTube link." }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);

    const seen = new Set<string>();
    const videoFormats = info.formats
      .filter((f) => f.hasVideo && f.qualityLabel)
      .sort((a, b) => (b.height || 0) - (a.height || 0))
      .filter((f) => {
        const key = f.qualityLabel!;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8)
      .map((f) => ({
        itag: f.itag,
        qualityLabel: f.qualityLabel!,
        container: f.container,
        hasAudio: f.hasAudio,
        approxSizeMB: f.contentLength ? Math.round(Number(f.contentLength) / 1e6) : null
      }));

    const bestAudio = ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: "audioonly" });

    return NextResponse.json({
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails.at(-1)?.url,
      durationSec: Number(info.videoDetails.lengthSeconds),
      videoFormats,
      bestAudioItag: bestAudio.itag
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Couldn't read that video. It may be private, age-restricted, or unavailable." },
      { status: 500 }
    );
  }
}
