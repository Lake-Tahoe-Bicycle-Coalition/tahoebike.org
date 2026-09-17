# Open questions, discrepancies, and decisions

Running log for the WordPress → Next.js migration. Each entry records what was found, what was assumed, and what still needs a human decision. Resolve an item by editing its **Decision** line and, if code changes are needed, committing directly to main.

Legend: **Assumed** = built this way for now, revisit any time. **Decided** = confirmed by Nick. **To do** = decided, but the work is not done yet. **Open** = nobody has decided yet.

## Content and pages

### Q1. `/programs/` is empty in the export
The WordPress page at `/programs/` is an empty Divi placeholder. The only index-like copy is on `/projects/` ("Our Programs": Communications, Wayfinding, Events, Advocacy).
**Decision (Sept 15 2026): Decided.** Build a new programs index page that highlights every program (Bike Kitchen, Bike Valet, Bike Racks, Bike Safety, Advocacy, Interactive Bike Map, Printable Bike Map, Tahoe Bike Month) using the short blurbs from `/projects/` where they fit.

### Q2. Published pages the plan does not list
These exist in the export but are not in the plan's page table:
`/bike-month-leaderboard/`, `/get-involved/`, `/projects/`, `/sponsors/`, `/stay-in-touch/`, `/where-to-ride/`, `/board-of-directors/`, `/volunteerdraft/`.
`/sponsors/` and `/stay-in-touch/` contain literal "TODO" text; `/where-to-ride/`, `/board-of-directors/`, `/volunteerdraft/` are empty; `/get-involved/` has a PayPal donate link and a dead link to `/get-involved/join/`.
**Decision (Sept 15 2026): Decided.** Leave them out for now; they may be obsolete. Phase 4 adds redirects so inbound links do not 404 (see Q12).
**Decision (Sept 17 2026): Decided.** Do not port the Bike Month leaderboard. `/bike-month-leaderboard/` redirects to `https://www.tahoebikemonth.org/`. The main site should carry no Bike Month content of its own; it only links out to tahoebikemonth.org.
**Checked (Sept 17 2026); to-do closed.** The export page (id 527, last modified June 15 2025) holds nine `ride.tahoebike.org/leaderboard/*` iframes (a library layout has two more, hence "10"); nothing in the export links to it except a 2022 test draft. `ride.tahoebike.org` and `www.tahoebikemonth.org` are the same custom Strava-based app, live with 2026 data, and its `/leaderboards` page already carries the WordPress page's copy and every board; the old iframe URLs now redirect to full pages, so the embeds are dead. The live WordPress site already 301s `/bike-month-leaderboard/` to `https://www.tahoebikemonth.org/leaderboard` through the Redirection plugin (whose rules are not in the export). TRPA's July 18 2023 press release, syndicated by three local papers, links straight to `tahoebike.org/bike-month-leaderboard/`, so the redirect must stay. Nothing is lost by retiring the page.
Verified the same day that the new site carries no Bike Month content of its own: every reference is an outbound link to `https://www.tahoebikemonth.org/` (the programs index card via the `bike_month_url` setting, the primary-nav and footer entries in `lib/navigation.ts`, and the seeded "June is Tahoe Bike Month" homepage card). The sponsor-logo and leaderboard Divi library layouts were not ported and had no public URL.
**Open.** The redirect currently lands on the Bike Month home page as decided; `https://www.tahoebikemonth.org/leaderboards` would match the press links better. Change it?

### Q3. Main contact email
Plan says `ltbcboard@gmail.com` for contact-form notifications and the rack application. The live contact form and the Advocacy page use `info@tahoebike.org`, which the plan never mentions. The Bike Kitchen "Join a fix-up" card links to `ltbcboard@gmail.com` while the page headline says `bikekitchen@tahoebike.org`.
**Decision (Sept 15 2026): Decided.** `info@tahoebike.org` is the main email everywhere. Program-specific addresses stay: `bikekitchen@tahoebike.org`, `bikevalet@tahoebike.org`. `ltbcboard@gmail.com` is no longer shown on the site.

### Q4. POINT (pointapp.org) volunteer embed
The Volunteer page is mostly an iframe of the POINT shift calendar, and the Bike Kitchen events box links to the POINT org page. POINT is not in the plan's external-services list.
**Decision (Sept 15 2026): Decided.** POINT is an important integration. Keep it as a plain iframe for now. Later: consider pulling shifts via POINT's API or embedding per-program views.

### Q5. Newsletter archive widget on `/join/`
The Join page has inline JS that fetches recent campaigns from the Constant Contact archive API (`campaignlp.constantcontact.com/v1/archive/<account>/activities`) and lists them, falling back to a subscribe link.
**Decision (Sept 15 2026): Decided.** Keep it. Built as a small, self-contained module (`lib/constant-contact.ts` + a `NewsletterArchive` component) so the Constant Contact fetching can be maintained and extended.

### Q6. Brand typeface licensing
The brand guide specifies Franklin Gothic ATF (commercial). The live site's custom CSS uses Degular and Work Sans instead.
**Decision (Sept 15 2026): Decided.** No font files available yet; use Libre Franklin (Google Fonts, open licence) with Franklin Gothic ATF first in the CSS font stack so that dropping in Adobe Fonts later is a one-line change. LTBC may have Adobe access; revisit.

### Q7. Family membership price
The heading on `/join/` reads just "Family" (no price); the button reads "Join for $40 / Year".
**Decision (Sept 15 2026): Decided.** Seed `membership_price_family = 40`.

### Q8. YouTube embeds
Plan says one video (Bike Kitchen). Export has three: one on Bike Kitchen, two on Bike Safety.
**Decision (Sept 15 2026): Decided.** Embed all three.

### Q9. Bike Kitchen event details are thin
Events in the export are one line each (date, time range, venue, address). No titles, descriptions, or registration links. The accordion as a whole links to the POINT org page.
**Assumed.** Seed `title` = venue name, `locationName` = venue, `address` = street address, `registrationUrl` = the POINT org page, `description` = empty. Times are interpreted as America/Los_Angeles.

### Q10. Advisors have no role, bio, or photo
The three advisors (Curtis Fong, Karen Fink, Pete Fink) are name-only team cards.
**Assumed.** Seed with `isAdvisor = true`, `role = "Advisor"`, empty bio, no photo. The About page renders a plain name list for advisors.

### Q11. Print map PDFs
The Printable Bike Map page links its two images to Google Drive PDFs (2026 maps). The export also contains 11 PDF attachments (2022, 2023, 2025 print maps and a Bike Month sponsor packet) that no published page links to.
**Decision (Sept 17 2026): Decided.** Keep the 2026 PDFs on Google Drive and keep the existing links; do not host them on the site. Do not download the unreferenced PDFs.

### Q12. Redirect targets for retired pages (Phase 4)
**Decision (Sept 15 2026): Decided/implemented.** Built as described below; the full map
(345 rules: host, `?page_id=`/`?p=`/`?attachment_id=`, retired pages, WordPress system paths,
attachment pages, old upload URLs) lives in `lib/redirects.ts` + `lib/redirects.generated.ts`
and is documented in [docs/REDIRECTS.md](REDIRECTS.md). Still worth a board sanity-check that
each retired page points somewhere sensible:

| Old path | Redirect to |
|---|---|
| `/get-involved/`, `/get-involved/join/` | `/join/` |
| `/projects/` | `/programs/` |
| `/stay-in-touch/` | `/contact/` |
| `/board-of-directors/` | `/about/` |
| `/sponsors/` | `/join/` |
| `/where-to-ride/` | `https://map.tahoebike.org/` |
| `/volunteerdraft/` | `/volunteer/` |
| `/bike-month-leaderboard/` | `https://www.tahoebikemonth.org/` (confirmed Sept 17 2026; see Q2) |
| `/bike-month/`, `/bike-month-discounts/` | `https://www.tahoebikemonth.org/` (added Sept 17 2026 from the live Redirection plugin) |
| `/bike-month-prizes/` | `https://www.tahoebikemonth.org/prizes` (same) |
| `/home/` | `/` |
| `/?page_id=N`, `/?p=N` | the page's current path |
| attachment pages (`/<image-slug>/`) | the parent page, else `/` |

### Q13. Footer Facebook link
The Divi footer links "Facebook" to a Facebook search URL rather than the page. Every other reference uses `facebook.com/laketahoebicyclecoalition`.
**Assumed.** Use the page URL.

### Q14. Untitled draft page (id 1280), modified Sept 15 2026
A draft that prototypes a "Discover Our Newsletter Archive" page using the same Constant Contact widget as `/join/`, plus a signup block.
**Resolved (Sept 17 2026).** WordPress published it as `/newsletter/` and linked it from the "Learn More" menu and the homepage signup blurb ("Read past newsletters here"). Ported as `app/newsletter/page.tsx` using the Q5 `NewsletterArchive` component and `NewsletterSignupForm`; `/newsletters` redirects to it.

### Q15. Privacy policy draft
`/privacy-policy/` exists as a 610-word draft that was never published.
**Decision (Sept 17 2026): Decided.** Publish a privacy policy as a static page. It rarely changes, so it lives in the source code and is updated with a code change when needed; no admin setting or external link.
**Done (Sept 17 2026).** `/privacy-policy` is a static page in `app/privacy-policy/page.tsx` (the last-updated date is a constant in the file), linked from the footer copyright line and listed in the sitemap. Its claims were checked against the code: three site forms at most (contact always; valet and racks only when `NATIVE_FORMS` enables them, otherwise the page describes the embedded Google Forms), Turnstile, Constant Contact, POINT, Memberful, YouTube (nocookie), Google Drive, Resend, Vercel, Google sign-in for admins only, no analytics and no cookies for visitors. Retention periods and the WordPress-era comment/Gravatar boilerplate from the draft were left out.

### Q16. Bike Valet request form fields
The current Google Form's questions are not in the export (only the embed URL is).
**Assumed, implemented.** Fields: contact name, organization, email, phone, event name, event date, start time, end time, location, expected attendance, expected number of bikes, organization type (nonprofit / Bike Coalition business member / both / neither), notes. Notifications go to `bike_valet_email`. Compare with the Google Form before retiring it and adjust `lib/forms/schemas.ts`.
**Decision (Sept 17 2026): Decided.** Launch with the existing embedded Google Form. Keep the native form built, but hidden behind a feature flag so the two can be switched and compared later. The flag lives in code or config, not on the admin page.
**Done (Sept 17 2026).** The page embeds the old site's Google Form (URL in `lib/feature-flags.ts`, embed in `components/google-form-embed.tsx`) unless the `NATIVE_FORMS` environment variable enables the native form (`valet`, `racks`, `all`; default none; see README "Feature flags"). The native server action also refuses submissions while its flag is off. The section heading reverted to the old page's "Request for an Event". The iframe uses the form's public `/forms/d/e/1FAIpQLSdtP_…/viewform` URL (the old document-id URL 301s to it).
**Compared (Sept 17 2026).** The Google Form ("Valet Bicycle Parking Request Form") has 16 questions in two sections and still accepts responses. Beyond the native schema it asks for the bike-parking location (surface, space constraints), an event web address, an event description for promotion and volunteer recruiting, and a separate mobile number for the day of the event; it asks only "Business Member? Yes/No" rather than the native nonprofit/member/both/neither choice; it has no numeric or date validation; and its intro asks for a month's notice and says pricing follows. Before the flag is ever flipped, add those four fields to `lib/forms/schemas.ts` and carry the intro copy.

### Q17. Bike Rack application form fields
Same situation as Q16.
**Assumed, implemented.** Fields: business name, contact name, email, phone, business address, number of racks requested (1–100), rack style (bolt-down / free-standing), matching funds (yes / partial / no), expected use and community benefit, notes. Shown only while `rack_program_open` is true; the server action also refuses submissions when the flag is off. Notifications go to `contact_email`.
**Decision (Sept 17 2026): Decided.** Same as Q16: launch with the embedded Google Form; keep the native form behind the same kind of code-level feature flag.
**Done (Sept 17 2026).** Same `NATIVE_FORMS` flag (`racks`). `rack_program_open` still decides whether any application form appears; the flag only chooses which one. The old page's bold line "Truckee businesses, apply here for bike racks!" was restored above the form.
**Open.** That line dates from the 2022 Truckee round (the old copy also said "apply until August 15, 2022", which was not ported). Is the next round Truckee-only, or should the line say "Tahoe and Truckee businesses"?
**Compared (Sept 17 2026).** The embedded Google Form is still titled "2022 Truckee Bike Rack Program", with 2022 dates and funders in its intro, and it accepts responses indefinitely; only name, email and organization are required. Beyond the native schema it asks about LTBC membership, the match amount, legal access to the installation site, and self-installation vs. assistance, and it never asks rack style. **Open:** the form needs a refresh in Google before the next round opens (`rack_program_open` is off, so it is not shown today), and the native schema should gain the membership, legal-access and installation questions before the flag is flipped.

### Q18. Contact form fields
The Divi form has First Name, Last Name, Email, Phone (optional), Message.
**Decided, implemented.** Same fields in the native form; notifications go to `contact_email` with reply-to set to the sender.

## Infrastructure and tooling

### Q19. Source layout
The session brief names `app/<slug>/page.tsx`, `scripts/`, `prisma/`. An empty `src/` folder was present in the repo.
**Assumed.** Use a root-level `app/` directory (no `src/`), matching the brief.

### Q20. Auth library
Plan allows Auth.js or Better Auth. Better Auth requires four of its own database tables, which conflicts with "do not add models beyond the plan".
**Assumed.** Auth.js (next-auth v5) with the Google provider and stateless JWT sessions; the `signIn` callback checks the `AdminUser` table. No adapter tables.

### Q21. Prisma connection style
Prisma 7 needs either a driver adapter (`@prisma/adapter-pg`, any Postgres URL) or the Prisma Postgres accelerate URL.
**Assumed.** Support both from a single `DATABASE_URL`: `prisma+postgres://` URLs use the built-in Prisma Postgres transport; anything else goes through `@prisma/adapter-pg`. Local development can use `prisma dev` (local Prisma Postgres) or any Postgres.

### Q22. Email provider
Plan says "Resend (or equivalent)".
**Assumed.** A thin `lib/email` adapter with a Resend implementation and a console/no-op implementation used when `RESEND_API_KEY` is absent.

### Q23. GitHub remote and deployment
The repo had no git history and no remote; `gh` is not installed on this machine.
**Decision (Sept 15 2026): Decided.** All work is committed directly on `main` (no feature branch or PR for this session).
**To do (confirmed Sept 17 2026).** Create the GitHub repository, add the remote, and push `main`. Once the repo exists, connect it to Vercel (import the repository, framework preset Next.js, package manager pnpm) so that `main` deploys production and every pull request gets a preview URL; the deployment steps are in the README.

### Q24. Admin allowlist
**Decision (Sept 17 2026): Decided.** Three initial addresses: the site maintainer, `info@tahoebike.org`, and the board's shared mailbox. The board mailbox is used for admin sign-in only; it is still not displayed on the site (Q3 stands).
**Done (Sept 17 2026).** The seed allowlists whatever `SEED_ADMIN_EMAILS` contains (set it in the deployment's environment before seeding); the addresses are deliberately not in the repo since it is public.

### Q25. Where WordPress form submissions currently go
The Divi contact form emails `info@tahoebike.org`; newsletter signups go to Constant Contact list `1199281500`. Google Form responses (valet, racks) live in the Google account that owns the forms.
**Resolved (Sept 17 2026).** The valet and rack Google Forms stay in use for launch (see Q16, Q17), so nothing is being retired and no response export is needed.

### Q26. Volunteer signup
**Open** (carried over from the plan): keep the Constant Contact volunteer list link plus POINT, or add a native form?
**Update (Sept 17 2026).** Constraint decided: volunteer signups are stored in Constant Contact, not in the site's own database. Still open: whether the signup form uses the site's own UI or Constant Contact's UI; no strong preference yet. Nick will evaluate by looking at both. Also check how signup currently works (Nick recalled it already being a native form).
**Checked (Sept 17 2026).** On the WordPress site the volunteer list has never had a native form: `/volunteer/`, `/join/`, `/get-involved/` and `/contact/` all link to Constant Contact's hosted page `https://lp.constantcontactpages.com/su/siO8tF5/volunteer`, and the export contains no volunteer list id (the only list id is the newsletter's, `1199281500`). The "native form" is the Divi Email Optin module on the home page and footer, which posts First/Last/Email to the **newsletter** list through Divi's stored Constant Contact credentials (v2 API, not reusable). The new site links to the same hosted volunteer page; its newsletter form is a GET hand-off to Constant Contact's hosted opt-in page, so nothing on the site can write to a list today. The hosted volunteer page could not be fetched from a script (Cloudflare challenge); Nick to open it in a browser.
**Options for Nick to evaluate.** (a) Own UI: a server action calling `POST https://api.cc.email/v3/contacts/sign_up_form` with the volunteer list id, which needs a Constant Contact developer app, a one-time OAuth2 grant (`contact_data offline_access`) by an LTBC account owner, a refresh token stored as a Vercel env var, plus Turnstile and the honeypot as in `lib/forms/actions.ts`; the same action would fix Q27's two-step newsletter signup. (b) Constant Contact's UI: keep the link (or iframe the landing page if it allows framing; unknown). URLs to look at: `https://tahoebike.org/volunteer/`, the volunteer landing page above, and the Divi form at the bottom of `https://tahoebike.org/`.

### Q27. Newsletter signup form target
The Divi signup module posted to Constant Contact through the WordPress plugin (list id `1199281500`), so the export contains no plain form endpoint, only the hosted opt-in page URL (`visitor.r20.constantcontact.com/manage/optin?v=...`).
**Assumed.** The new site renders a plain HTML form that submits GET to that hosted opt-in page with the `v` parameter and an `email` field. Tested Sept 15 2026: the hosted page loads but does **not** prefill the email, so visitors retype their address there (two steps instead of one). Fix options: generate an embeddable sign-up form in the Constant Contact dashboard and point the `constant_contact_signup_url` setting at its endpoint, or add a server action using the Constant Contact API. The newsletter archive endpoint (`campaignlp.constantcontact.com/v1/archive/<account>/activities`) works server-side and currently returns four campaigns with `subject` and `campaignUrl` only (no dates).
**Update (Sept 17 2026).** The live `/join/` page was edited after the Sept 15 export: its "Get Email Updates" button now points to a newer Constant Contact landing page, `https://lp.constantcontactpages.com/sl/thRVMu4/bikecoalitionsignup` (not in the export), and draft page 1280 (Q14) is now published at `https://tahoebike.org/newsletter/`. That landing page is a candidate target for `constant_contact_signup_url` either way; see also option (a) under Q26.

### Q28. "Support the Coalition" call-to-action layout
The Divi library contains a saved "Support the Coalition" header (Donate / Learn More buttons over a photo) that was probably shown above the footer on some pages. The export does not record where it was placed.
**Assumed.** Not ported. Easy to add as a shared component under the footer if wanted.

### Q29. Photo credits and alt text
The export has no alt text for most images (only sponsor logos). Alt text on the new site was written by the migration agents from the image content and file names.
**Decision (Sept 17 2026): Decided.** Do not add photo credits that did not exist on the old site; keep any credits that did exist.
**To do.** Create a document indexing every image on the site with its alt text, so Nick can review the alt text for accuracy.

### Q30. Large hero image
The "Tahoe Bike Map" homepage card uses `2023/05/LTBC_SouthLake-2023-Print.png` (5.0 MB, the full print map). next/image serves resized versions, so visitors never download the original, but the repo carries it.
**To do (Sept 17 2026).** Replace the image with a resized, more compressed version. Also look for other images in the repo that should be resized the same way.

### Q31. Retired page links inside ported copy
The programs index reuses the old `/projects/` "Communications" blurb, whose "Stay In Touch" link pointed at the retired `/stay-in-touch/` page. It now links to the newsletter signup on `/join#newsletter` (Q12 sends the retired path to `/contact`).
**Assumed.** Fine either way; change the link if the contact page should be the newsletter home instead.

### Q32. Markdown link policy for admin-entered content
Board bios and event descriptions render through a small safe Markdown subset (paragraphs, bold, italic, links, bullet lists). Links are limited to http, https, and mailto, so a root-relative link such as `/join` renders as plain text.
**Assumed.** Relax to allow root-relative paths if editors need internal links. (The admin's dedicated URL fields — card buttons, sign-up links, announcement links — do accept site paths such as `/join` via `optionalLink`/`requiredLink` in `lib/forms/validators.ts`; only links typed inside Markdown text are restricted.)

### Q33. Print map image dimensions
The brief guessed portrait maps; the 2026 print map images are 1908×1404 landscape. Pages use the measured dimensions.
**Decided by measurement.** No action.

### Q34. Query strings survive the legacy redirects
Next appends the incoming query string to every `next.config` redirect destination, so an old
`/?page_id=9` link lands on `/about?page_id=9` rather than `/about`. The same applies to every
`?p=` and `?attachment_id=` rule. A `proxy.ts` (Next 16's middleware) could strip the leftover
parameter and issue a clean redirect.
**Decision (Sept 17 2026): Decided.** Leave as is; no proxy. The leftover parameter is harmless
cruft: pages ignore unknown parameters and the canonical link tag tells search engines the clean URL.

**Related gap: closed (Sept 15 2026).** Every public page now declares
`alternates.canonical` through the shared `pageMetadata()` helper in `lib/site-metadata.ts`,
including the three redirect destinations that previously lacked one (`/bike-racks`,
`/contact`, `/programs/bike-valet`). Verified Sept 17 2026: all three serve
`<link rel="canonical">` at the clean path, so they no longer rely on the leftover query
parameter simply being ignored.

### Q35. Open Graph image typography
`app/opengraph-image.tsx` renders the default share card with next/og, which bundles only Geist
Regular. The brand's heavy display weight is approximated with a same-colour text shadow that
thickens the strokes; up close it is not the real typeface.
**Decision (Sept 17 2026): Decided.** Won't fix for now; keep the text-shadow approximation.
Supplying a TTF (Libre Franklin Black, or Franklin Gothic ATF if LTBC gets Adobe access — see
Q6) through `ImageResponse`'s `fonts` option remains the fix if this is ever revisited.

### Q36. Two-hop redirects for retired paths with trailing slashes
The site runs with Next's default `trailingSlash: false`, so `/get-involved/` is first
normalized to `/get-involved` (308) and then redirected to `/join` (308) — two hops for old
inbound links that carry WordPress's trailing slash.
**Assumed.** Acceptable: both hops are permanent, browsers and crawlers follow them, and the
alternative (duplicating every rule with a slashed source) roughly doubles the rule count for no
user-visible gain.

## Admin console (Phase 3)

### Q37. Development sign-in bypass
Google OAuth is not configured locally, and the admin cannot be exercised without a session.
**Assumed, implemented (Sept 17 2026).** `ADMIN_DEV_EMAIL` in `.env` signs that address in under `next dev` only (`lib/admin/auth.ts` checks `NODE_ENV === "development"`, which builds, `next start` and every Vercel deployment do not set). It skips the allowlist on purpose so the allowlist page can be tested from an empty table. If this feels too permissive, the alternative is a local Google OAuth client for `http://localhost:3000`.

### Q38. Seed no longer overwrites content
The seed used to restore the WordPress export values over every board member, card and event on each run, and to retire seed rows missing from the export. With `/admin` in place that would silently undo board edits (the README's deploy steps say to seed production once, but nothing would stop a second run).
**Assumed, implemented (Sept 17 2026).** Every upsert now has an empty `update`: the seed only adds rows that do not exist. To reload the export from scratch, `pnpm prisma migrate reset`. If content still needs fixing from the export before launch, do it once via reset or via the admin. The allowlist (Q24) is now also editable at `/admin/users`.

### Q39. Events for programs other than Bike Kitchen
`Event.program` has BIKE_KITCHEN, BIKE_VALET and OTHER, but only `/programs/bike-kitchen` lists events. Bike Valet and Other events can be entered in `/admin/events` and are stored, but appear nowhere.
**Open.** Add an events list to `/programs/bike-valet` (and/or a general upcoming-events section on the home page), or trim the enum to what the site shows. The admin form says so in its help text.

### Q40. Orphaned uploads in Vercel Blob
Images upload from the browser to Blob before the form is saved. If the editor then abandons the form, or replaces an image and later cancels, the uploaded file stays in the store. Deleting a row or replacing a saved image does remove the old blob (`deleteBlobIfOurs`).
**Assumed.** Acceptable: orphaned images are small and cheap. A periodic sweep (list blobs under `uploads/`, delete any URL not referenced by `BoardMember.photoUrl` or `HomepageCard.imageUrl`) could be added as a script if the store grows.

### Q41. Public-page freshness after admin edits
Public pages are static (`revalidate = 300` on the root layout). Admin actions call `revalidatePath` for the affected pages (`lib/admin/revalidate.ts`); announcements and settings purge the whole site because they render in the layout.
**Assumed.** Good enough for a site this size. If the Vercel CDN still shows stale HTML for a moment after a save, that is the edge cache catching up, not a bug.
