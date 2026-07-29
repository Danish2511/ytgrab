import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath as string);

function sanitize(name: string) {
  return name.replace(/[^\w\s-]/g, "").trim().slice(0, 80) || "download";
}

function downloadToFile(stream: NodeJS.ReadableStream, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(filePath);
    stream.pipe(ws);
    ws.on("finish", () => resolve());
    ws.on("error", reject);
    stream.on("error", reject);
  });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const type = req.nextUrl.searchParams.get("type"); // "video" | "audio"
  const itagParam = req.nextUrl.searchParams.get("itag");

  if (!url || !ytdl.validateURL(url) || !itagParam || (type !== "video" && type !== "audio")) {
    return NextResponse.json({ error: "Missing or invalid parameters." }, { status: 400 });
  }
  const itag = Number(itagParam);

  const id = randomUUID();
  const tmpDir = os.tmpdir();
  const cleanup: string[] = [];

  try {
    const info = await ytdl.getInfo(url);
    const title = sanitize(info.videoDetails.title);

    if (type === "audio") {
      const audioPath = path.join(tmpDir, `${id}-audio.webm`);
      const outPath = path.join(tmpDir, `${id}-out.mp3`);
      cleanup.push(audioPath, outPath);

      const audioFormat = info.formats.find((f) => f.itag === itag) || ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: "audioonly" });
      await downloadToFile(ytdl.downloadFromInfo(info, { format: audioFormat }), audioPath);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(audioPath)
          .audioBitrate(192)
          .toFormat("mp3")
          .on("end", () => resolve())
          .on("error", reject)
          .save(outPath);
      });

      const fileBuffer = fs.readFileSync(outPath);
      cleanup.forEach((p) => fs.existsSync(p) && fs.unlinkSync(p));

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="${title}.mp3"`
        }
      });
    }

    // type === "video"
    const chosen = info.formats.find((f) => f.itag === itag);
    if (!chosen) {
      return NextResponse.json({ error: "That format is no longer available." }, { status: 404 });
    }

    if (chosen.hasAudio) {
      // Progressive format: video + audio already combined, stream directly
      const filePath = path.join(tmpDir, `${id}-progressive.${chosen.container}`);
      cleanup.push(filePath);
      await downloadToFile(ytdl.downloadFromInfo(info, { format: chosen }), filePath);
      const fileBuffer = fs.readFileSync(filePath);
      cleanup.forEach((p) => fs.existsSync(p) && fs.unlinkSync(p));

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": `video/${chosen.container}`,
          "Content-Disposition": `attachment; filename="${title}.${chosen.container}"`
        }
      });
    }

    // Video-only format: fetch matching best audio and mux together
    const videoPath = path.join(tmpDir, `${id}-video.${chosen.container}`);
    const audioPath = path.join(tmpDir, `${id}-audio.webm`);
    const outPath = path.join(tmpDir, `${id}-muxed.mp4`);
    cleanup.push(videoPath, audioPath, outPath);

    const bestAudio = ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: "audioonly" });

    await Promise.all([
      downloadToFile(ytdl.downloadFromInfo(info, { format: chosen }), videoPath),
      downloadToFile(ytdl.downloadFromInfo(info, { format: bestAudio }), audioPath)
    ]);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions(["-c:v copy", "-c:a aac", "-shortest"])
        .on("end", () => resolve())
        .on("error", reject)
        .save(outPath);
    });

    const fileBuffer = fs.readFileSync(outPath);
    cleanup.forEach((p) => fs.existsSync(p) && fs.unlinkSync(p));

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${title}.mp4"`
      }
    });
  } catch (err: any) {
    cleanup.forEach((p) => fs.existsSync(p) && fs.unlinkSync(p));
    return NextResponse.json({ error: "Download failed. Try a lower quality or another link." }, { status: 500 });
  }
}
