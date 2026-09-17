/**
 * The redirect map for next.config.ts: every WordPress-era URL that must keep
 * working on the new site (Phase 4 of docs/MIGRATION_PLAN.md, Q12 in
 * docs/OPEN_QUESTIONS.md).
 *
 * Generated entries (attachment pages, `?p=` / `?page_id=` / `?attachment_id=`
 * ids, old `wp-content/uploads` URLs) live in lib/redirects.generated.ts and
 * are rebuilt with `pnpm content:redirects`. Everything else is hand-written
 * here. Order matters: Next applies the first matching rule.
 *
 * Trailing slashes: Next's default (`trailingSlash: false`) already answers
 * `/about/` with a 308 to `/about` before these rules run, so no source here
 * carries a trailing slash and nothing re-implements that normalization. A
 * retired path with a trailing slash therefore takes two hops
 * (`/projects/` → `/projects` → `/programs`).
 *
 * Query strings: Next appends the request's query string to every redirect
 * destination (see `prepareDestination` in next/dist/shared/lib/router/utils),
 * so `/?page_id=9` lands on `/about?page_id=9`. That is harmless (pages ignore
 * unknown params and every page declares a canonical URL) and cannot be
 * avoided with next.config redirects. It also means any rule from `/` back to
 * `/` would redirect to itself forever, so there is deliberately no
 * `/?s=term` → `/` search rule and no catch-all for unknown `?page_id=` /
 * `?p=` / `?attachment_id=` values: those URLs simply render the home page.
 */
import type { NextConfig } from "next";
import { attachmentIdRedirects, attachmentPageRedirects, pageIdRedirects, uploadRedirects } from "./redirects.generated";

/** One entry of the array `next.config.ts`'s `redirects()` resolves to. */
export type Redirect = Awaited<ReturnType<NonNullable<NextConfig["redirects"]>>>[number];

/** Pages that existed on the WordPress site but were not ported (Q2/Q12), with their new home. */
export const retiredPages: Readonly<Record<string, string>> = {
  "/get-involved": "/join",
  "/get-involved/join": "/join",
  "/projects": "/programs",
  "/stay-in-touch": "/contact",
  "/board-of-directors": "/about",
  "/sponsors": "/join",
  "/where-to-ride": "https://map.tahoebike.org/",
  "/volunteerdraft": "/volunteer",
  "/bike-month-leaderboard": "https://www.tahoebikemonth.org/",
  "/home": "/",
};

/** Plausible misspellings of current pages, so a mistyped or guessed URL still lands. */
export const pathAliases: Readonly<Record<string, string>> = {
  "/newsletters": "/newsletter",
};

/** WordPress archive, feed, and system paths that have no equivalent on the new site. */
const wordpressSystemPaths = [
  "/category/:slug*",
  "/tag/:slug*",
  "/author/:slug*",
  "/feed",
  "/feed/:path*",
  "/comments/feed",
  "/wp-login.php",
  "/wp-admin/:path*",
  "/xmlrpc.php",
];

function permanent(source: string, destination: string): Redirect {
  return { source, destination, permanent: true };
}

/** `/?<key>=<id>` → destination. The value is anchored (`^id$`) by Next, so 9 does not match 19. */
function queryRedirect(key: string, id: number, destination: string): Redirect {
  return {
    source: "/",
    has: [{ type: "query", key, value: String(id) }],
    destination,
    permanent: true,
  };
}

/** Canonical host is the apex domain (Q23): send www traffic there, path and query intact. */
const hostRedirects: Redirect[] = [
  {
    source: "/",
    has: [{ type: "host", value: "www.tahoebike.org" }],
    destination: "https://tahoebike.org/",
    permanent: true,
  },
  {
    source: "/:path+",
    has: [{ type: "host", value: "www.tahoebike.org" }],
    destination: "https://tahoebike.org/:path+",
    permanent: true,
  },
];

/**
 * WordPress "ugly" permalinks for pages and attachments whose new home is a
 * real page. Anything resolving to "/" is skipped (see the query-string note
 * above); `?p=` covers pages only because the export has no posts.
 */
const queryRedirects: Redirect[] = [
  ...pageIdRedirects
    .filter(([, destination]) => destination !== "/")
    .flatMap(([id, destination]) => [
      queryRedirect("page_id", id, destination),
      queryRedirect("p", id, destination),
    ]),
  ...attachmentIdRedirects
    .filter(([, destination]) => destination !== "/")
    .map(([id, destination]) => queryRedirect("attachment_id", id, destination)),
];

const retiredPageRedirects: Redirect[] = Object.entries(retiredPages).map(([source, destination]) =>
  permanent(source, destination),
);

const aliasRedirects: Redirect[] = Object.entries(pathAliases).map(([source, destination]) =>
  permanent(source, destination),
);

const wordpressSystemRedirects: Redirect[] = wordpressSystemPaths.map((source) => permanent(source, "/"));

/** Every redirect, in evaluation order. */
export const redirects: Redirect[] = [
  ...hostRedirects,
  ...queryRedirects,
  ...retiredPageRedirects,
  ...aliasRedirects,
  ...wordpressSystemRedirects,
  ...attachmentPageRedirects.map(([source, destination]) => permanent(source, destination)),
  ...uploadRedirects.map(([source, destination]) => permanent(source, destination)),
];
