import type { NextConfig } from "next";
import { redirects } from "./lib/redirects";
import { VERCEL_BLOB_IMAGE_HOSTNAME } from "./lib/urls";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 16 writes AGENTS.md/CLAUDE.md on `next dev`; this repo documents agents in README/docs instead.
  agentRules: false,
  images: {
    // Admin-uploaded images (Phase 3) live in Vercel Blob; lib/urls.ts mirrors this rule.
    remotePatterns: [{ protocol: "https", hostname: VERCEL_BLOB_IMAGE_HOSTNAME }],
  },
  // WordPress-era URLs (see lib/redirects.ts). `trailingSlash` stays at its default (false),
  // so Next itself answers `/about/` with a 308 to `/about`.
  async redirects() {
    return redirects;
  },
};

export default nextConfig;
