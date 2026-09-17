# Redirects

Every URL the WordPress site answered should keep working. The redirect map lives in
`lib/redirects.ts` (hand-written rules) plus `lib/redirects.generated.ts` (built from the
WordPress export), and `next.config.ts` hands the combined list to Next.

**347 rules total, all permanent (HTTP 308).**

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
| `?p=N` | 19 | `/?p=690` → `/bike-kitchen` |
| `?attachment_id=N` | 4 | `/?attachment_id=108` → `/join` |
| Retired pages | 13 | `/projects` → `/programs` |
| Moved pages | 2 | `/programs/bike-kitchen` → `/bike-kitchen` |
| Path aliases | 1 | `/newsletters` → `/newsletter` |
| WordPress system paths | 9 | `/wp-login.php` → `/` |
| Attachment pages | 205 | `/june-3-bike-path-cleanup` → `/`; `/sponsors/tahoe_fund` → `/join` |
| Old upload URLs | 73 | `/wp-content/uploads/2022/05/Nick-Speal-150x150.jpg` → `/images/2022/05/Nick-Speal.jpg` |

`?p=` covers pages rather than posts because the export contains no posts. Attachment
pages are the WordPress "page per uploaded file" URLs; all but four have no ported parent
page and go to the home page. Old upload URLs cover the images that were downloaded into
`/public/images`, including WordPress's resized variants (`-150x150`), which all point at
the full-size file.

### Retired pages (13)

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
| `/bike-month` | `https://www.tahoebikemonth.org/` |
| `/bike-month-discounts` | `https://www.tahoebikemonth.org/` |
| `/bike-month-prizes` | `https://www.tahoebikemonth.org/prizes` |
| `/home` | `/` |

The last three come from the WordPress Redirection plugin, whose rules are not in the export;
they were read from the live site on Sept 17 2026.

### Moved pages (2)

Current pages whose URL was shortened on Sept 17 2026 (`movedPages` in `lib/redirects.ts`).
Both forms work; the short one is canonical and is what the sitemap and navigation use.

| Old path | Goes to |
|---|---|
| `/programs/bike-kitchen` | `/bike-kitchen` |
| `/programs/bike-valet` | `/bike-valet` |

### Path aliases (1)

Plausible misspellings of current pages (`pathAliases` in `lib/redirects.ts`).

| Alias | Goes to |
|---|---|
| `/newsletters` | `/newsletter` |

### WordPress system paths (9)

All go to the home page: `/category/*`, `/tag/*`, `/author/*`, `/feed`, `/feed/*`,
`/comments/feed`, `/wp-login.php`, `/wp-admin/*`, `/xmlrpc.php`.

## The generated file

`lib/redirects.generated.ts` was built once, during the September 2026 migration, from the
WordPress XML export (attachment pages, post ids, upload URLs). The export and its generator
left the repo when it went public, so the file is now a hand-maintained list: edit it directly
when an old URL needs a new destination, keeping entries sorted.

## Adding a rule by hand

Edit `lib/redirects.ts`. Retired WordPress pages go in the `retiredPages` map (a
`?page_id=` entry for the same page in `lib/redirects.generated.ts` should point at the same
destination). A page whose URL changes goes in `movedPages` (and every reference to the old path,
including `?page_id=` entries in the generated file, should move with it). Misspellings of
current pages go in `pathAliases`. Anything else is a plain
entry in the exported `redirects` array. Rules are evaluated in order and the first match
wins.

Vercel allows at most **1,024 redirects** in `next.config`. At 347 there is room, but a
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
