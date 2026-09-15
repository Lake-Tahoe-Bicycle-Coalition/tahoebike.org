# Open questions, discrepancies, and decisions

Running log for the WordPress → Next.js migration. Each entry records what was found, what was assumed, and what still needs a human decision. Resolve an item by editing its **Decision** line and, if code changes are needed, opening a PR.

Legend: **Assumed** = built this way for now, revisit any time. **Decided** = confirmed by Nick. **Open** = nobody has decided yet.

## Content and pages

### Q1. `/programs/` is empty in the export
The WordPress page at `/programs/` is an empty Divi placeholder. The only index-like copy is on `/projects/` ("Our Programs": Communications, Wayfinding, Events, Advocacy).
**Decision (Sept 15 2026): Decided.** Build a new programs index page that highlights every program (Bike Kitchen, Bike Valet, Bike Racks, Bike Safety, Advocacy, Interactive Bike Map, Printable Bike Map, Tahoe Bike Month) using the short blurbs from `/projects/` where they fit.

### Q2. Published pages the plan does not list
These exist in the export but are not in the plan's page table:
`/bike-month-leaderboard/`, `/get-involved/`, `/projects/`, `/sponsors/`, `/stay-in-touch/`, `/where-to-ride/`, `/board-of-directors/`, `/volunteerdraft/`.
`/sponsors/` and `/stay-in-touch/` contain literal "TODO" text; `/where-to-ride/`, `/board-of-directors/`, `/volunteerdraft/` are empty; `/get-involved/` has a PayPal donate link and a dead link to `/get-involved/join/`.
**Decision (Sept 15 2026): Decided.** Leave them out for now; they may be obsolete. Phase 4 adds redirects so inbound links do not 404 (see Q12). Revisit whether the Bike Month leaderboard (10 iframes to `ride.tahoebike.org`) should be ported or moved to tahoebikemonth.org.

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
**Assumed.** Keep the Google Drive links; do not download the unreferenced PDFs. Open: should the 2026 PDFs be hosted on the site instead of Drive?

### Q12. Redirect targets for retired pages (Phase 4)
**Assumed** map, to be confirmed:
| Old path | Redirect to |
|---|---|
| `/get-involved/`, `/get-involved/join/` | `/join/` |
| `/projects/` | `/programs/` |
| `/stay-in-touch/` | `/contact/` |
| `/board-of-directors/` | `/about/` |
| `/sponsors/` | `/join/` |
| `/where-to-ride/` | `https://map.tahoebike.org/` |
| `/volunteerdraft/` | `/volunteer/` |
| `/bike-month-leaderboard/` | `https://www.tahoebikemonth.org/` (or port; see Q2) |
| `/home/` | `/` |
| `/?page_id=N`, `/?p=N` | the page's current path |
| attachment pages (`/<image-slug>/`) | the parent page, else `/` |

### Q13. Footer Facebook link
The Divi footer links "Facebook" to a Facebook search URL rather than the page. Every other reference uses `facebook.com/laketahoebicyclecoalition`.
**Assumed.** Use the page URL.

### Q14. Untitled draft page (id 1280), modified Sept 15 2026
A draft that prototypes a "Discover Our Newsletter Archive" page using the same Constant Contact widget as `/join/`, plus a signup block.
**Assumed.** Not ported. The reusable widget from Q5 makes it easy to add such a page later if wanted.

### Q15. Privacy policy draft
`/privacy-policy/` exists as a 610-word draft that was never published.
**Open.** Should the new site publish a privacy policy? The native forms collect names, emails, and phone numbers, so one is advisable.

### Q16. Bike Valet request form fields
The current Google Form's questions are not in the export (only the embed URL is). The native form needs a field list.
**Assumed** fields: contact name, organization, email, phone, event name, event date, start/end time, location, expected attendance, expected number of bikes, whether the organizer is a nonprofit or LTBC business member, notes. Compare with the Google Form before retiring it.

### Q17. Bike Rack application form fields
Same situation as Q16.
**Assumed** fields: business name, contact name, email, phone, business address, number of racks requested, rack style (bolt-down or free-standing), ability to provide matching funds, expected use / community benefit, notes.

### Q18. Contact form fields
The Divi form has First Name, Last Name, Email, Phone (optional), Message.
**Assumed.** Same fields in the native form.

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
**Decision (Sept 15 2026): Decided.** All work is committed directly on `main` (no feature branch or PR for this session). Still **open**: create the GitHub repository, add the remote, push `main`, and connect it to Vercel for preview deployments.

### Q24. Admin allowlist
**Open.** Which board emails go in `AdminUser`? The seed contains a clearly marked placeholder.

### Q25. Where WordPress form submissions currently go
The Divi contact form emails `info@tahoebike.org`; newsletter signups go to Constant Contact list `1199281500`. Google Form responses (valet, racks) live in the Google account that owns the forms.
**Open** (carried over from the plan): export Google Form responses before retiring the forms.

### Q26. Volunteer signup
**Open** (carried over from the plan): keep the Constant Contact volunteer list link plus POINT, or add a native form?

### Q27. Newsletter signup form target
The Divi signup module posted to Constant Contact through the WordPress plugin (list id `1199281500`), so the export contains no plain form endpoint, only the hosted opt-in page URL (`visitor.r20.constantcontact.com/manage/optin?v=...`).
**Assumed.** The new site renders a plain HTML form that submits GET to that hosted opt-in page with the `v` parameter and an `email` field. If Constant Contact ignores the `email` parameter, the visitor lands on the hosted page and re-enters their address, which still works. Better: generate an embeddable "Sign-up form" in the Constant Contact dashboard and paste its endpoint into the `constant_contact_signup_url` setting.

### Q28. "Support the Coalition" call-to-action layout
The Divi library contains a saved "Support the Coalition" header (Donate / Learn More buttons over a photo) that was probably shown above the footer on some pages. The export does not record where it was placed.
**Assumed.** Not ported. Easy to add as a shared component under the footer if wanted.

### Q29. Photo credits and alt text
The export has no alt text for most images (only sponsor logos). Alt text on the new site was written by the migration agents from the image content and file names.
**Open.** Have a board member review alt text and confirm no photo needs a credit.
