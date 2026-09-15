import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 16 writes AGENTS.md/CLAUDE.md on `next dev`; this repo documents agents in README/docs instead.
  agentRules: false,
  images: {
    // Admin-uploaded images (Phase 3) live in Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
