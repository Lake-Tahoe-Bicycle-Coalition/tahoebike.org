import type { Metadata } from "next";

/**
 * Shared page metadata. Next replaces (never merges) a page's `openGraph` with the
 * root layout's, so every page that sets any Open Graph field must restate these
 * defaults; `pageMetadata()` does that in one place.
 */

export const SITE_NAME = "Lake Tahoe Bicycle Coalition";

export const openGraphDefaults = {
  type: "website",
  siteName: SITE_NAME,
  locale: "en_US",
} as const satisfies Metadata["openGraph"];

type PageMetadataInput = {
  /** Page title; the root layout appends " | Lake Tahoe Bicycle Coalition". */
  title: string;
  description: string;
  /** Site-relative path, e.g. "/about"; becomes the canonical URL via metadataBase. */
  path: `/${string}`;
  /**
   * Page-specific share image (site-relative path under /public). Omit it and the page
   * inherits the default app/opengraph-image.
   */
  image?: { url: string; alt: string };
};

/**
 * Metadata for a public page: title, description, canonical URL, and Open Graph tags.
 *
 * Next only processes the keys a page sets and fills og:title / og:description from
 * `title` / `description` afterwards. So a page without its own image must not set
 * `openGraph` at all: the root layout's resolved openGraph (the defaults above plus the
 * file-based /opengraph-image) then carries through. Setting even `{ ...openGraphDefaults }`
 * would replace it and drop the default image.
 */
export function pageMetadata({ title, description, path, image }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(image ? { openGraph: { ...openGraphDefaults, images: [image] } } : {}),
  };
}
