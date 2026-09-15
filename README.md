# tahoebike.org

The Lake Tahoe Bicycle Coalition website, rebuilt on Next.js and deployed on Vercel.
Page copy lives in code; a small set of frequently changing content (events, board roster,
homepage cards, announcements, site settings, form submissions) lives in Postgres and is
edited at `/admin`.

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
so only `DATABASE_URL` is required to run the public site.

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
| `pnpm db:seed` | Run `prisma/seed.ts` (idempotent; upserts by stable keys) |
| `pnpm content:parse` | Parse the WordPress export into `content/generated/*.json` |
| `pnpm content:images` | Download referenced `wp-content/uploads` images into `public/images` |

## Database changes

Edit `prisma/schema.prisma`, then run `pnpm db:migrate --name <change>` and commit the new
folder under `prisma/migrations/`. Never edit the database schema by hand. Do not add models
beyond those in the migration plan without a discussion.

## Content changes

Page copy is React code under `app/`. Change it in a pull request; every PR gets a Vercel
preview deployment. Content that board members edit themselves lives in the database and is
managed at `/admin` (Phase 3).

## Deploying

1. Import the GitHub repository into Vercel (framework preset: Next.js, package manager: pnpm).
2. Add the **Prisma Postgres** integration from the Vercel Marketplace. It sets `DATABASE_URL`.
3. Add the remaining variables from `.env.example` in the Vercel project settings:
   `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`,
   `BLOB_READ_WRITE_TOKEN`. Set `AUTH_TRUST_HOST=true` for preview deployments.
4. Run migrations against the production database once, then after any schema change:
   `DATABASE_URL=<production url> pnpm db:deploy`, and seed once with `pnpm db:seed`.
5. Push to `main` to deploy production; every pull request gets a preview URL.

DNS cutover (apex and `www` only; never touch the `map` subdomain or MX records) is described
in the migration plan.

## Continuous integration

`.github/workflows/ci.yml` runs `pnpm install`, `prisma validate`, typecheck, and lint on every
pull request and push to `main`.
