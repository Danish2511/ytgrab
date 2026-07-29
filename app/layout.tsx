import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reel — grab video or audio, straight from a link",
  description: "Paste a YouTube link, pick a quality, download the file. Self-hosted, no accounts."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grain min-h-screen font-body">{children}</body>
    </html>
  );
}
