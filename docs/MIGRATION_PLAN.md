# tahoebike.org Migration Plan

**Status:** The site went live at tahoebike.org on October 22 2026. Phases 1–5 are complete and have been removed from this plan; the remaining work is Phase 6 and the open items below
**Last updated:** September 2026

## Background

The Lake Tahoe Bicycle Coalition (LTBC) is an all-volunteer nonprofit. Its public website, [tahoebike.org](https://tahoebike.org), has run on WordPress with a page-builder theme for years. WordPress was chosen so that non-technical board members could edit pages themselves.

In practice, that flexibility hasn't paid off. The site is small and mostly static, and the content that does change is narrow and predictable (event dates, the board roster, homepage callouts). Meanwhile, pages drift out of date because nothing expires automatically, and page-builder editing is error-prone (one page currently has its entire body duplicated; another still advertises a 2022 application deadline).

AI coding agents are now good enough that maintaining a small site as a source code repository is cheaper and more reliable than maintaining a CMS. This project moves the site to a code-first stack while preserving a small, deliberately limited admin interface for the handful of things board members need to edit without touching code.

## Goals

1. Replace WordPress with a TypeScript/React codebase deployed on Vercel.
2. Preserve all existing content and URL structure (no broken inbound links, no SEO regression).
3. Give non-technical board members simple admin-only forms for the few content types that change regularly.
4. Make time-bound content (events, announcements) expire automatically.
5. Set up the repo so that future changes are made by an AI agent producing pull requests, reviewed on Vercel preview deployments.

## Non-goals (for the initial migration)

- **Matching the current visual design.** The first milestone is content and structure. Design will be iterated on afterward, guided by the brand guidelines file in this repo.
- **Rebuilding membership, payments, or email marketing.** Memberful and Constant Contact stay as external services; we link to them exactly as the current site does.
- **A general-purpose CMS.** If someone wants a new page or a new kind of content, that's a code change. The admin is intentionally minimal.
- **Moving `map.tahoebike.org` or `tahoebikemonth.org`.** These are separate properties and are only linked to.

## Current site inventory

Source of truth for all existing copy: the WordPress XML export in this repo (`Tools → Export → All content`). Image URLs in the export point at `wp-content/uploads/...` on the live site.

### Pages

| Path | Purpose | Dynamic content |
|---|---|---|
| `/` | Home: four hero callout cards, bike map promo, newsletter signup, photo gallery | Hero cards |
| `/join/` | Membership tiers (Individual $20, Family $40, Business $100), one-time and recurring donations, volunteer/newsletter/board CTAs | Prices, Memberful links |
| `/volunteer/` | Volunteer info | — |
| `/programs/` | Programs index | — |
| `/programs/bike-kitchen/` | Bike donation/repair program, upcoming fix-up events, YouTube embed, gallery | Events |
| `/programs/bike-valet/` | Valet bike parking for events, pricing, request form (currently Google Form) | Request form |
| `/bike-racks/` | Regional Bicycle Parking Program, business application (currently Google Form) | Application form, program open/closed |
| `/bike-safety/` | Safety campaign content | — |
| `/advocacy/` | Advocacy committee content | — |
| `/print-bike-map/` | Printable map info | — |
| `/about/` | Mission/vision, board of directors with headshots and bios, advisors | Board roster |
| `/contact/` | Contact form, mailing address, social links | Contact form |

### External services (keep, link to)

- **Memberful** (`tahoebike.memberful.com`): membership checkout and donations
- **Constant Contact**: newsletter opt-in and volunteer signup list
- **Google Forms**: bike valet request and bike rack application (to be replaced by native forms)
- **YouTube**: one embedded video on the Bike Kitchen page
- **Instagram / Facebook**: links only

### Contact addresses in use

`ltbcboard@gmail.com`, `bikekitchen@tahoebike.org`, `bikevalet@tahoebike.org`. Mailing address: PO Box 1147, Zephyr Cove, NV 89448.

## Target architecture

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript, React Server Components |
| Styling | Tailwind CSS |
| Hosting | Vercel (preview deployment per PR) |
| Database | Prisma Postgres via the Vercel Marketplace integration; Prisma ORM |
| Admin auth | Google sign-in (Auth.js or Better Auth) restricted to an allowlist of board emails stored in the DB |
| Image uploads | Vercel Blob for admin-uploaded images (headshots, event photos). Static design assets live in `/public`. |
| Transactional email | Resend (or equivalent) for form-submission notifications |
| Spam protection | Cloudflare Turnstile on public forms |
| Package manager | pnpm |

## Content split: code vs. database

This is the core design decision. Keep the database small.

### Lives in code (edited via AI agent + PR)

- All page layouts, navigation, footer
- The body copy of every page (as React components or MDX)
- Styling and design system
- Redirect map

### Lives in the database (edited via `/admin`)

| Model | Fields (approx.) | Rationale |
|---|---|---|
| `Event` | title, program (enum: BIKE_KITCHEN, BIKE_VALET, OTHER), startsAt, endsAt, locationName, address, description, registrationUrl | Bike Kitchen events change monthly. Hidden automatically once `endsAt` passes. |
| `BoardMember` | name, role, bio (Markdown), photoUrl, sortOrder, isAdvisor, isActive | Roster changes roughly yearly. |
| `HomepageCard` | title, blurb, ctaLabel, ctaUrl, imageUrl, sortOrder, isActive | The four hero cards rotate seasonally. |
| `Announcement` | message, linkUrl, startsAt, endsAt | Optional site-wide banner; expires automatically. |
| `SiteSetting` | key, value | Membership prices, mailing address, contact emails, Memberful/Constant Contact URLs, rack-program-open flag. Seeded with current values. |
| `FormSubmission` | formType (enum: CONTACT, VALET_REQUEST, RACK_APPLICATION), payload (JSON), submittedAt, status | All public form submissions, stored and emailed. |
| `AdminUser` | email, name, createdAt | Allowlist for admin sign-in. |

### Admin (`/admin`)

- One plain list/create/edit/delete page per model above
- A submissions inbox with filtering by form type and status
- Markdown textarea with preview for bios and descriptions; no WYSIWYG editor
- Image upload field that writes to Vercel Blob and stores the URL

## Public forms

Three native forms replace the current mix of WordPress forms and Google Forms. Each: validates server-side, stores a `FormSubmission`, sends a notification email to the relevant address, protected by Turnstile.

| Form | Page | Notify |
|---|---|---|
| Contact | `/contact/` | `info@tahoebike.org` (the `contact_email` `SiteSetting`; see Q3) |
| Bike valet request | `/programs/bike-valet/` | `bikevalet@tahoebike.org` |
| Bike rack application | `/bike-racks/` | `info@tahoebike.org` (the `contact_email` `SiteSetting`; see Q3); only shown when the program is flagged open |

Newsletter signup continues to post to Constant Contact.

## Phases

Phases 1–5 (scaffold, content and structure, admin, redirects and SEO, and the DNS cutover) are done. What remains:

### Phase 6: Design iteration (after launch)
- Iterate on visual design against the brand guidelines, page by page, via AI-generated PRs and preview deployments

## Conventions for AI agents working in this repo

- Content changes to pages are code changes; DB models are for the content types listed above only. Don't add new models without a discussion.
- Every PR must pass typecheck and lint and should be reviewable on a Vercel preview URL.
- Never commit secrets. All config comes from environment variables documented in `.env.example`.
- Prisma schema changes require a migration (`prisma migrate dev`); never edit the database schema by hand.
- Keep dependencies minimal. Prefer Next.js built-ins over libraries.
- Read `BRAND_GUIDELINES` (see repo root) before any styling work.

### Where things are

| What | Where |
|---|---|
| Page copy | `app/**/page.tsx` |
| Shared components | `components/` |
| Site setting keys and defaults | `lib/settings.ts` (labels and groups for the admin form: `lib/admin/settings/fields.ts`) |
| Admin console | `app/admin/(console)/**` (pages), `lib/admin/<model>/{fields,schema,actions}.ts` (validation and server actions), `components/admin/` (forms and widgets). Events is the template. |
| Shared form validation | `lib/forms/validators.ts` (zod primitives), `lib/forms/parse.ts` (FormData helpers) |
| Redirect map | `lib/redirects.ts` (+ `lib/redirects.generated.ts`), documented in `docs/REDIRECTS.md` |
| Decisions and open questions log | `docs/OPEN_QUESTIONS.md` |
| WordPress export parsing and content scripts | `lib/wp-export/` and `scripts/` |
| Database seed | `prisma/seed.ts` |

## Open items

- [ ] Create the Vercel Blob store so admin image uploads work (TECHNICAL.md, Deploying)
- [ ] Add the Turnstile and Resend keys so the native forms work end to end
- [ ] Confirm where the old WordPress contact-form and newsletter submissions went
- [ ] Get owner access to the two Google Forms (to download past responses before retiring them)
- [ ] Decide whether Volunteer signup should also become a native form or stay on Constant Contact
