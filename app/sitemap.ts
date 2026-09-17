import type { MetadataRoute } from "next";
import { publicPaths } from "@/lib/navigation";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tahoebike.org";

type PublicPath = (typeof publicPaths)[number];

/** Pages whose content is edited in the admin (cards, events) change more often than plain copy. */
const weekly: ReadonlySet<PublicPath> = new Set<PublicPath>(["/", "/programs", "/bike-kitchen"]);

/** Relative crawl priority; paths not listed here get 0.6. */
const priorities: Partial<Record<PublicPath, number>> = {
  "/": 1,
  "/join": 0.8,
  "/programs": 0.8,
  "/bike-kitchen": 0.8,
  "/volunteer": 0.7,
  "/bike-valet": 0.7,
  "/print-bike-map": 0.7,
  "/about": 0.7,
  "/privacy-policy": 0.3,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return publicPaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified,
    changeFrequency: weekly.has(path) ? "weekly" : "monthly",
    priority: priorities[path] ?? 0.6,
  }));
}
