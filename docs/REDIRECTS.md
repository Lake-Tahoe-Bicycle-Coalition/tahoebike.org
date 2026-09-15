# Redirects

Every URL the WordPress site answered should keep working. The redirect map lives in
`lib/redirects.ts` (hand-written rules) plus `lib/redirects.generated.ts` (built from the
WordPress export), and `next.config.ts` hands the combined list to Next.

**341 rules total, all permanent (HTTP 308).**

## Canonical host

`https://tahoebike.org` is canonical, matching what WordPress used. Two rules send
`www.tahoebike.org` to the apex domain, preserving path and query string.

Vercel can do the same thing at the domain level (add both domains, mark the apex as
primary). Keeping the rules in code means the behaviour is visible in the repo and works
on preview deployments too; if the Vercel redirect is configured later, these two rules
become redundant but harmless.

## Trailing slashes

Next's default (`trailingSlash: false`) already answers `/about/` with a 308 to `/about`
before any of these rules run, so no rule sources a trailing slash and nothing
re-implements that normalization. A retired path typed with a slash takes two hops:
`/get-involved/` → `/get-involved` → `/join`.

## Two Next.js behaviours that shaped the map

1. **Query strings pass through.** Next appends the incoming query string to every
   `next.config` redirect destination, so `/?page_id=9` lands on `/about?page_id=9`.
   Pages ignore unknown parameters, and a page's canonical link tag points at the clean
   URL, so search engines index `/about`. It cannot be turned off in `next.config`; see
   Q34 in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
2. **Therefore no rule may redirect `/` to `/`.** Such a rule would match its own
   destination (the query string comes along) and loop forever. So unknown ids, drafts,
   the home page's own id, and `/?s=<term>` searches have no rule at all — those URLs
   simply render the home page.

## Rule groups

| Group | Rules | Example |
|---|---:|---|
| `www` → apex | 2 | `https://www.tahoebike.org/join` → `https://tahoebike.org/join` |
| `?page_id=N` | 19 | `/?page_id=9` → `/about` |
| `?p=N` | 19 | `/?p=690` → `/programs/bike-kitchen` |
| `?attachment_id=N` | 4 | `/?attachment_id=108` → `/join` |
| Retired pages | 10 | `/projects` → `/programs` |
| WordPress system paths | 9 | `/wp-login.php` → `/` |
| Attachment pages | 205 | `/june-3-bike-path-cleanup` → `/`; `/sponsors/tahoe_fund` → `/join` |
| Old upload URLs | 73 | `/wp-content/uploads/2022/05/Nick-Speal-150x150.jpg` → `/images/2022/05/Nick-Speal.jpg` |

`?p=` covers pages rather than posts because the export contains no posts. Attachment
pages are the WordPress "page per uploaded file" URLs; all but four have no ported parent
page and go to the home page. Old upload URLs cover the images that were downloaded into
`/public/images`, including WordPress's resized variants (`-150x150`), which all point at
the full-size file.

### Retired pages (10)

Pages that existed in WordPress and were not ported (see Q2 and Q12 in
[OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).

| Old path | Goes to |
|---|---|
| `/get-involved` | `/join` |
| `/get-involved/join` | `/join` |
| `/projects` | `/programs` |
| `/stay-in-touch` | `/contact` |
| `/board-of-directors` | `/about` |
| `/sponsors` | `/join` |
| `/where-to-ride` | `https://map.tahoebike.org/` |
| `/volunteerdraft` | `/volunteer` |
| `/bike-month-leaderboard` | `https://www.tahoebikemonth.org/` |
| `/home` | `/` |

### WordPress system paths (9)

All go to the home page: `/category/*`, `/tag/*`, `/author/*`, `/feed`, `/feed/*`,
`/comments/feed`, `/wp-login.php`, `/wp-admin/*`, `/xmlrpc.php`.

## Regenerating the map

```bash
pnpm content:redirects
```

This rebuilds `lib/redirects.generated.ts` from the WordPress XML export in `reference/`
and `content/image-map.json`. The output is sorted and carries no timestamps, so running
it against an unchanged export produces no diff. The generator fails loudly rather than
guessing when:

- a published page in the export is neither in `publicPaths` (`lib/navigation.ts`) nor in
  `retiredPages` (`lib/redirects.ts`) — add it to one of them;
- a generated source (an attachment page) would shadow a real page or a retired path;
- a destination is not a public path, or the image map points somewhere other than
  `/images/...`.

Re-run it after adding or removing a page, changing a path, or re-running
`pnpm content:images`.

## Adding a rule by hand

Edit `lib/redirects.ts`. Retired WordPress pages go in the `retiredPages` map (the
generator reads it too, so `?page_id=` links to those pages follow along). Anything else
is a plain entry in the exported `redirects` array. Rules are evaluated in order and the
first match wins. Do not edit `lib/redirects.generated.ts` — it is overwritten.

Vercel allows at most **1,024 redirects** in `next.config`. At 341 there is room, but a
new bulk source (another site's worth of attachment pages, say) should be checked against
that ceiling; the alternative is handling them in `proxy.ts` instead.

## Related

- **`/sitemap.xml`** — `app/sitemap.ts`, generated from `publicPaths` in
  `lib/navigation.ts`. Redirect sources are deliberately absent.
- **`/robots.txt`** — `app/robots.ts`. Allows everything except `/admin` and `/api`, and
  points at the sitemap.
- **Default share image** — `app/opengraph-image.tsx` renders a 1200×630 PNG at build
  time (emblem, name, tagline) used by every page that does not set its own
  `openGraph.images`.

Site URL for all three comes from `NEXT_PUBLIC_SITE_URL`, defaulting to
`https://tahoebike.org`.
