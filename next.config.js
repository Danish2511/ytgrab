/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.ytimg.com" }
    ]
  },
  serverRuntimeConfig: {},
  experimental: {
    serverComponentsExternalPackages: ["@distube/ytdl-core", "fluent-ffmpeg", "ffmpeg-static"]
  }
};

module.exports = nextConfig;
