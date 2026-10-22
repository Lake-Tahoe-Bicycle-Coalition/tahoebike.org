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
    // Fewer widths means fewer distinct optimized variants to generate, cache and pay for.
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1600],
    imageSizes: [96, 144, 256, 384],
    // One year. Images in public/ never change in place (docs/TECHNICAL.md forbids renaming or
    // editing them), and admin-uploaded Blob images get unique URLs, so long caching is safe.
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Clickjacking protection only; deliberately not a full CSP.
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
      {
        // Keep every non-canonical host (tahoebikeorg.vercel.app, preview deployments) out of search
        // indexes until DNS cutover so they do not duplicate tahoebike.org. `has.value` is compiled
        // as `^value$`, so a negative lookahead works. www is allowed because it redirects to apex.
        source: "/(.*)",
        has: [{ type: "host", value: "(?!(www\\.)?tahoebike\\.org$).*" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  // WordPress-era URLs (see lib/redirects.ts). `trailingSlash` stays at its default (false),
  // so Next itself answers `/about/` with a 308 to `/about`.
  async redirects() {
    return redirects;
  },
};

export default nextConfig;
