# tahoebike.org

The Lake Tahoe Bicycle Coalition website, rebuilt on Next.js and deployed on Vercel.
Page copy lives in code; a small set of frequently changing content (events, board roster,
homepage cards, announcements, site settings, form submissions) lives in Postgres and is
edited at `/admin`.

The source is public so it can be read and contributed to, but it is not open source:
see [LICENSE](LICENSE). LTBC's name, logos and photos are not licensed for reuse.

Read [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) for the why and the architecture, and
[docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) for decisions still pending.

## Stack

- Next.js (App Router, React Server Components), TypeScript strict, Tailwind CSS
- Prisma ORM on Postgres (Prisma Postgres on Vercel; any Postgres locally)
- Auth.js with Google sign-in for `/admin`, restricted to emails in the `AdminUser` table
- pnpm

## Local setup

Requirements: Node 22.12+ (24 recommended), pnpm 12 (`corepack enable`), and a Postgres
database. [Postgres.app](https://postgresapp.com) works well on macOS; `pnpm prisma dev`
starts a local Prisma Postgres if you prefer not to install one.

```bash
pnpm install
cp .env.example .env         # then edit DATABASE_URL at minimum
createdb tahoebike           # if using a local Postgres
pnpm db:migrate              # apply migrations (creates the database schema)
pnpm db:seed                 # load board, events, cards, and settings from the export
pnpm dev                     # http://localhost:3000
```

Every variable is documented in [.env.example](.env.example). All external services
(email, Turnstile, Vercel Blob, Google sign-in) no-op cleanly when their variables are absent,
so only `DATABASE_URL` is required to run the public site. To open `/admin` locally without
setting up Google OAuth, set `ADMIN_DEV_EMAIL=you@example.com`; `next dev` then treats that
address as a signed-in admin (builds and deployments ignore the variable).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` | `prisma generate` + production build |
| `pnpm typecheck` | `prisma generate` + `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm db:validate` | Validate `prisma/schema.prisma` |
| `pnpm db:migrate --name <change>` | Create and apply a migration after editing the schema |
| `pnpm db:deploy` | Apply pending migrations (production) |
| `pnpm db:seed` | Run `prisma/seed.ts` (add-only: creates missing rows, never overwrites existing ones) |
| `pnpm content:optimize [--dry-run] [--all]` | Resize (long edge ≤ 2400 px) and recompress oversized images in `public/images` in place; paths and formats never change. Idempotent |
| `pnpm content:image-index` | Regenerate `docs/IMAGE_INDEX.md`, the list of every image on the site with its alt text and where it is used |

The seed loads board members, homepage cards and Bike Kitchen events from
`prisma/seed-data.json`, a snapshot of the old WordPress site's public content, and
allowlists the addresses in `SEED_ADMIN_EMAILS` for `/admin`. It never modifies a row that
already exists, so board edits made in `/admin` survive a re-run; to reload the snapshot
values from scratch, reset the database (`pnpm prisma migrate reset`, which re-runs the seed).

When poking at the database with `psql`, note that Prisma stores `timestamp` columns as UTC
while Postgres.app sessions default to local time; run `PGTZ=UTC psql ...` to avoid
7-hour surprises when inserting announcements or events by hand.

## Database changes

Edit `prisma/schema.prisma`, then run `pnpm db:migrate --name <change>` and commit the new
folder under `prisma/migrations/`. Never edit the database schema by hand. Do not add models
beyond those in the migration plan without a discussion.

## Content changes

Page copy is React code under `app/`. Change it in a pull request; every PR gets a Vercel
preview deployment. Content that board members edit themselves lives in the database and is
managed at `/admin` (see below).

Images live in `public/images` and are referenced by path from page code, from
`prisma/seed-data.json` and from database rows, so never rename or move one. After adding a
large photo run `pnpm content:optimize` to shrink it in place, and after adding, removing or
re-describing an image run `pnpm content:image-index` and commit the updated
[docs/IMAGE_INDEX.md](docs/IMAGE_INDEX.md), which is where alt text is reviewed.

## Feature flags

The Bike Valet request (`/programs/bike-valet`) and the Bike Rack application (`/bike-racks`)
each exist twice: the Google Form the old site embedded, and a native form that stores
submissions in the database and shows them in the admin inbox. The site launches with the
Google Forms (decisions Q16 and Q17 in `docs/OPEN_QUESTIONS.md`); the native forms stay in
the code so the two can be compared later.

`NATIVE_FORMS` chooses which native forms are shown instead of their Google Form. It is an
environment variable, not an admin setting, so it is set per deployment in the Vercel project
(for example on a preview) or in `.env`:

| Value | Effect |
|---|---|
| unset, `none` | Both pages embed their Google Form (the default) |
| `valet`, `racks`, `valet,racks` | The named native forms replace their Google Form |
| `all` | Both native forms |

The logic and the two Google Form URLs live in `lib/feature-flags.ts`; the embed is
`components/google-form-embed.tsx`. While a native form is off, its server action refuses
submissions as well, so a stale page cannot post to it. The bike-rack `rack_program_open`
admin setting still decides whether any application form appears; the flag only picks
which one. A change takes effect on the next deployment, since the pages are prerendered.

## Admin console

`/admin` is a small set of plain forms for the content that changes often. There is one
section per database model, plus a submissions inbox:

| Section | Edits | Shows up on |
|---|---|---|
| Events | Bike Kitchen fix-ups and other dated events; hidden automatically once they end | `/programs/bike-kitchen` |
| Board | Board members and advisors: name, role, bio, headshot, order, active flag | `/about` |
| Homepage cards | The hero callout cards: title, blurb, button, image, order | `/` |
| Announcements | The site-wide banner, with a start and end time | every page |
| Settings | Prices, contact addresses, external links, the bike-rack-program flag | wherever the value is used |
| Submissions | Contact messages, valet requests, rack applications (also emailed when received) | nothing public |
| Admins | The Google accounts allowed to sign in | — |

How it fits together:

- **Sign-in** is Google OAuth (Auth.js) restricted to the `AdminUser` table. `requireAdmin()`
  in `lib/admin/auth.ts` runs at the top of every admin page and server action; the layout is
  not the security boundary.
- **Forms** are React server actions using the same zod validators as the public forms
  (`lib/forms/validators.ts`). Each model has `lib/admin/<model>/{fields,schema,actions}.ts`
  and a client form in `components/admin/<model>-form.tsx`; the Events files are the template.
- **Times** are entered and shown in Pacific time and stored as UTC (`lib/admin/datetime.ts`).
- **Rich text** is a small Markdown subset (`lib/markdown.tsx`) with a preview toggle. No WYSIWYG.
- **Images** upload from the browser straight to Vercel Blob using a short-lived token from
  `app/api/admin/upload/route.ts` (admins only, images only, 10 MB max). Without
  `BLOB_READ_WRITE_TOKEN` the image fields still accept a pasted URL or a `/images/...` path.
- **Freshness**: public pages are static and revalidate every five minutes; every admin save
  also purges the affected pages (`lib/admin/revalidate.ts`), so edits show at once.

## Deploying

1. Import the GitHub repository into Vercel (framework preset: Next.js, package manager: pnpm).
2. Add the **Prisma Postgres** integration from the Vercel Marketplace. It sets `DATABASE_URL`.
3. Create a **Blob** store (Storage tab) and connect it to the project. It sets
   `BLOB_READ_WRITE_TOKEN`, which enables image uploads in the admin.
4. Create a Google OAuth client (Google Cloud Console > APIs & Services > Credentials, type
   "Web application") with the authorized redirect URI
   `https://tahoebike.org/api/auth/callback/google` (add the preview/`www` origins if admins
   should sign in there too).
5. Add the remaining variables from `.env.example` in the Vercel project settings:
   `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`.
   Set `AUTH_TRUST_HOST=true` for preview deployments.
6. Run migrations against the production database once, then after any schema change:
   `DATABASE_URL=<production url> pnpm db:deploy`, and seed once with `pnpm db:seed`.
   Set `SEED_ADMIN_EMAILS` (comma-separated) in the shell running the seed so it allowlists
   the first admins; further admins are added at `/admin/users`.
7. Push to `main` to deploy production; every pull request gets a preview URL.

`next build` prerenders every public page (they are static, revalidated every five
minutes), so the build itself needs a reachable `DATABASE_URL`. On Vercel the Prisma
Postgres integration provides it to build steps as well; anywhere else (CI, a local
`pnpm build`) point `DATABASE_URL` at a database with the schema applied. Pages fall
back to their code defaults if a query fails, but the build must be able to connect.

DNS cutover (apex and `www` only; never touch the `map` subdomain or MX records) is described
in the migration plan.

## Continuous integration

`.github/workflows/ci.yml` runs `pnpm install`, `prisma validate`, typecheck, and lint on every
pull request and push to `main`.
