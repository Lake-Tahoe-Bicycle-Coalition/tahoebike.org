# UX improvement ideas

**Status:** Proposal backlog, nothing here is decided yet
**Written:** October 13 2026, against `main` at `192ec3d` and the production deploy at `https://tahoebikeorg.vercel.app`

This is a review of the rebuilt site from the visitor's point of view. It covers accessibility, visual design and brand, navigation, content, conversion (membership, donations, newsletter, volunteering), forms, events, performance, responsiveness, SEO and the admin features that keep public content fresh. Each idea says what is wrong or missing, with file references, and what to do about it.

The migration plan deliberately put design off until after launch (Phase 6). Many of the visual ideas below are that iteration; the rest are gaps or bugs worth fixing before or soon after the DNS cutover.

How this was produced: the code was read page by page and component by component, rendered HTML and response headers were fetched from production (no forms were submitted), and color contrast was computed from the theme tokens in `app/globals.css`. Nothing was tested in a real browser, on a phone, or with a screen reader, so items that depend on runtime behavior are marked **(verify in a browser)**.

## Legend

- **Value:** benefit to visitors, weighted by how many visitors hit it. **High** = affects a core task (find the map, give money, get a bike fixed, contact LTBC) or fails an accessibility requirement; **Medium** = noticeably better experience for a meaningful group; **Low** = polish.
- **Effort:** **S** = an afternoon or less; **M** = one to three days; **L** = more, or needs a new subsystem.
- **Needs:** **Code** = an agent can do it from the repo alone; **Board** = needs content, numbers or a decision from LTBC; **Both**.
- Items that conflict with an existing decision in `docs/OPEN_QUESTIONS.md` say so and name the question.
- Items that would add a database model or field are flagged, because the migration plan's conventions require a discussion first.

## Start here

The fifteen ideas with the best value for the effort, roughly in order:

1. **NAV-2** Close the nav menus after a link is followed (likely bug, S).
2. **A11Y-1, A11Y-2, A11Y-3** Fix the three measured contrast failures: input borders, focus ring on yellow, link on yellow (S).
3. **EVT-1** The Bike Kitchen schedule goes empty after the October 21 fix-up; add the winter schedule or a better empty state (S).
4. **HOME-2** Replace the "June is Tahoe Bike Month / Sign Up" homepage card, which is out of season (Board, S).
5. **FORM-1** Confirm contact-form email delivery works in production and make failures visible (S).
6. **NAV-1** Put a Donate button in the header and footer (S).
7. **HOME-1** Give the homepage a photo hero with a one-line "who we are" and two or three task buttons (M).
8. **GIVE-1, GIVE-2** Explain what each membership tier gets and simplify the donation panels (Both, S to M).
9. **CONT-1** Add nonprofit trust signals: 501(c)(3) status, EIN, tax-deductibility, how money is used (Board, S).
10. **GIVE-4** Add the "Support the Coalition" band above the footer on every page (Q28) (S to M).
11. **NAV-4** Promote the bike map to a top-level nav item (S).
12. **VIS-1** Build a shared page-header component with a photo band for interior pages (M).
13. **SEO-1** Add structured data: Organization/NGO, Event and BreadcrumbList (M).
14. **PERF-1** Add cookieless Vercel Speed Insights and Web Analytics so UX changes can be measured (S, needs a privacy policy update).
15. **SEO-4, SEO-5** Before cutover, stop the `vercel.app` host being indexed and script a check of the redirect map (S to M).

## Bugs and time-sensitive problems found during the review

These are defects or deadlines, not enhancements. Each one also appears in its category below.

| ID | Problem | Why it matters now |
|---|---|---|
| NAV-2 | Nav menus probably stay open after a client-side navigation | Every mobile visitor who uses the menu |
| EVT-1 | `/bike-kitchen` has one upcoming event (Oct 21); after that it shows the bare empty state | Eight days from the date of this review |
| HOME-2 | Homepage card "June is Tahoe Bike Month … Sign Up" is live in October | Visible on the homepage today |
| FORM-1 | A contact submission shows "success" even when no notification email is sent | `TASKS.md` lists "Figure out what is set up with Turnstile and Resend" as unknown |
| A11Y-1 | Form input borders are 2.52:1 against white (WCAG needs 3:1) | Every form |
| A11Y-2 | The focus ring is 2.48:1 on the yellow panels | The skip link, the announcement banner, the newsletter panel |
| PERF-5 | A transient database error during revalidation caches a page with no cards or banner for five minutes | Homepage and every page with a banner |
| SEO-4 | `tahoebikeorg.vercel.app` is indexable and duplicates the site | Until DNS cutover |

---

## 1. Navigation and wayfinding

### NAV-1. Persistent Donate button in the header and footer
**Value: High · Effort: S · Needs: Code**
"Join" is a plain text link in `primaryNav` (`lib/navigation.ts`), and "Donate" appears nowhere in the header, footer or homepage. It exists only as a section about 1,000 px down `/join` (`id="donate-heading"`). A visitor who wants to give has to guess that "Join" is where donations live. Add a visually distinct `btn btn-primary` "Donate" at the right end of the desktop nav and at the top of the mobile menu, linking to `/join#donate-heading` (or give the section a shorter `id="donate"`). Add a Donate link to the footer as well.

### NAV-2. Close the nav menus after a link is followed (likely bug)
**Value: High · Effort: S · Needs: Code · (verify in a browser)**
The header lives in the root layout, so it persists across App Router navigations. `components/nav-menus.tsx` closes open `<details>` menus on an outside click, on Escape and on focus leaving. It deliberately ignores clicks *inside* an open menu, and it never listens for a route change. Choosing "Bike Valet" from the expanded mobile menu should therefore leave the full menu open over the new page. Fix: `usePathname()` plus an effect that sets `open = false` on every open `details` when the path changes, or close the menu when the click target is inside an `<a>`.

### NAV-3. Show the current page in the nav
**Value: Medium · Effort: S · Needs: Code**
No link anywhere sets `aria-current`, and there is no visual active state. Add a small client `NavLink` that compares `usePathname()` with its href, sets `aria-current="page"`, and adds a cue such as a safety-yellow underline bar. Mark the "Programs" or "Learn More" summary as well when one of its children is the current page.

### NAV-4. Promote the bike map; mark off-site links visibly
**Value: High · Effort: S · Needs: Code**
The interactive map is LTBC's flagship product and probably the most common visitor task, but it is the second of nine items inside the Programs dropdown. Two of those nine items ("Tahoe Bike Month" and "Interactive Bike Map") leave the site in a new tab, with nothing visible to say so (`SmartLink` adds only a screen-reader note). Add "Bike Map" as a top-level nav item. Add a small external-link icon to every link that opens a new tab, across the site, keeping the existing sr-only text.

*Status (October 2026):* deferred. The map stays in the Programs dropdown as "Interactive Bike Map" until analytics show how much it is used. The external-link icon was declined: the map and Tahoe Bike Month should feel like one identity with this site.

### NAV-5. Rename "Learn More" and surface Contact
**Value: Medium · Effort: S · Needs: Code**
"Learn More" (`lib/navigation.ts`) is a vague parent for About, Newsletter and Contact, and Contact is a high-intent link hidden two clicks deep. Rename the group to "About" and make Contact a top-level item. Alternatively, group Join, Volunteer and Donate under a "Get Involved" parent so the top level reads Bike Map · Programs · Get Involved · About · Contact · [Donate].

*Status (October 2026):* partly done in the navigation PR. The group is now "About" (About stays its index link). Contact stays under About with Newsletter rather than at the top level; it is also in the footer.

### NAV-6. Use one name per thing
**Value: Medium · Effort: S · Needs: Both (pick names)**
The same things go by different names:
- The map: "Online Bike Map" on the homepage, "Lake Tahoe Bikeways Map" in its copy, "Interactive Bike Map" in the nav, and "Tahoe Bike Map" on a homepage card.
- The rack program: "Bike Racks" in the nav, "Regional Bicycle Parking Program" as the page h1.
- The Bike Kitchen: "Bike Kitchen", "Bike Kitchen & Bike Donation program" and "Bike Kitchen and Donation program".
- The organization: "LTBC", "the Coalition" and "the Bike Coalition", with "LTBC" used before it is defined on some pages.

Pick one name for each, use it in the nav, cards, headings and metadata, and add the canonical names to the conventions section of the migration plan.

### NAV-7. Rework the footer
**Value: Medium · Effort: S · Needs: Code**
`footerColumns` in `lib/navigation.ts` has an "About" column holding Home (redundant), "Board of Directors" (which links to the general `/about`) and Programs. The footer leaves out Bike Kitchen, Bike Racks, Advocacy, the printable map, the newsletter and Donate. Facebook and Instagram are text links under "Get Involved".
- Reorganize into Programs / Get Involved / Resources / About columns, with task-shaped labels ("Request a bike valet", "Get bike racks for your business", "Donate or get a bike").
- Add social icons, the reversed white logo (`reference/logos/Primary Logo/LTBC-Logo-white.png`), the brand tagline and the EIN line (CONT-1).
- Use a single `<nav aria-label="Footer">` instead of three landmarks named "About", "Resources" and "Get Involved" (A11Y-11).

### NAV-8. Sticky compact header on long pages
**Value: Low · Effort: S · Needs: Code**
The header scrolls away, so on long pages (`/about`, `/bike-safety`, `/bike-racks`) a phone user has to scroll back to the top to navigate. Make it `sticky top-0` with a smaller logo after scrolling. Add `scroll-padding-top` so anchor links and the skip link aren't hidden behind it, and cap the open mobile menu at `max-h-[80vh] overflow-auto` for landscape phones.

### NAV-9. A more helpful 404 page
**Value: Medium · Effort: S · Needs: Code**
`app/not-found.tsx` is an h1 and one sentence, and its `<title>` is just "Lake Tahoe Bicycle Coalition" (no metadata export). The old WordPress site and years of press coverage will send visitors to stale URLs that the redirect map doesn't cover.
- Set `title: "Page not found"`.
- List the top tasks: Bike Map, Donate/Join, Volunteer, Bike Kitchen, Bike Valet, Contact.
- Add "Tell us what you were looking for" with the contact email.
- Give it some personality ("Wrong turn?" with the bike icon from VIS-2).

### NAV-10. Breadcrumbs on program pages
**Value: Low · Effort: S · Needs: Code**
Program pages moved from `/programs/bike-kitchen/` to `/bike-kitchen`, which flattens the hierarchy. A "Programs › Bike Kitchen" breadcrumb above the h1 gives orientation and pairs with BreadcrumbList structured data (SEO-1). It fits naturally in the shared page header (VIS-1).

### NAV-11. Site search
**Value: Low · Effort: M · Needs: Code**
Not recommended yet. With 14 public pages, a better 404 (NAV-9) and a fuller footer (NAV-7) cover the need. Revisit if a news section (CONT-4) or an advocacy letter archive (CONT-5) makes the site much larger.

---

## 2. Homepage

### HOME-1. A photo hero that says who LTBC is and what to do
**Value: High · Effort: M · Needs: Both (one-line description)**
The hero (`app/page.tsx`) is a flat safety-yellow strip with an eyebrow and the h1 "Helping Tahoe become more bicycle friendly". It has no photo, no sentence about what LTBC actually does, and no button. The first actions are the admin-managed cards below it, below the fold on a phone.
- **Photo:** a full-bleed photo hero, 60–70 vh on desktop. The unused `2022/04/2020.05.07_Biking_Upper-Truckee-Marsh_California-Tahoe-Conservancy_DSC_2130-cropped.jpg` is already 1920×800 with mountains behind. `Bike-Ambassador-2021-East-Shore-path-1.jpg` (2400×1800) is the other strong lake shot.
- **Text:** an asphalt gradient overlay with the h1 in white, and one sentence such as "An all-volunteer nonprofit that makes the Tahoe Bike Map, fixes and donates bikes, parks bikes at events, and works for safer streets."
- **Buttons:** one primary ("Explore the bike map") and one or two secondary ("Join or donate", "Volunteer").
- **Image loading:** mark the hero image `priority` (PERF-7).

### HOME-2. Fix out-of-season and vague homepage cards
**Value: High · Effort: S · Needs: Board (copy); Code (optional schema change)**
The seeded cards (`prisma/seed-data.json`, editable at `/admin/cards`) include "June is Tahoe Bike Month … Sign Up", which is live in October. Its "Sign Up" button leaves the site without saying so. The "Tahoe Bike Map" card uses the 2023 print map image, and the first card's CTA is the generic "Learn More".
- **Now:** rewrite the Bike Month card for the off-season ("Tahoe Bike Month returns every June"), and give each card a specific verb ("Donate or get a bike", "Visit Tahoe Bike Month"). This keeps to the Q2 decision that Bike Month content lives on tahoebikemonth.org; it is only an outbound card.
- **Later:** give cards an optional show-from/show-until window, as announcements already have, so seasonal cards switch themselves on and off. This adds fields to `HomepageCard`, so it needs the schema discussion.

### HOME-3. One loud call to action per screen
**Value: Medium · Effort: S · Needs: Code**
Three safety-yellow blocks compete on the homepage: the hero strip, four yellow card buttons, and the yellow newsletter panel (`components/newsletter-signup-form.tsx`). Keep yellow for the single primary action in view:
- Card buttons become secondary or text links.
- The newsletter panel moves to a Tahoe Blue tint or asphalt.
- "Follow us" (two large outlined buttons at the bottom of the page) becomes a row of icons, or moves to the footer.

### HOME-4. Make the map feature bigger and point to both maps
**Value: Medium · Effort: S · Needs: Code**
The "Online Bike Map" section shows a 560 px screenshot with a thin border. The screenshot and the button below it are two separate links to the same URL, and the image link's accessible name describes the picture rather than the destination (A11Y-8). Make it a wide feature: a large screenshot with an "Open the interactive map" overlay, plus a second button "Get the printable map" pointing at `/print-bike-map`, which few visitors will otherwise find. Drop "new" from "Check out our new, interactive bike map!", since it will date.

### HOME-5. An impact strip
**Value: High · Effort: S (once numbers exist) · Needs: Board**
The only numbers on the site are on `/bike-racks` (450 racks, 900 parking spots, eight fix-it stations). A row of four or five stats on the homepage, reused on `/about` and `/join`, would answer "why should I care or give?" at a glance. For example: bikes donated through the Bike Kitchen, bikes parked by the valet, racks installed, maps distributed, comment letters sent. Label the figures "as of 2026" so their age is visible.

### HOME-6. "Coming up" strip
**Value: Medium · Effort: M · Needs: Code**
The homepage gives no sign of what is happening next. Show the next two or three events from the `Event` table (all programs, not only the Bike Kitchen) and any active seasonal item. This also resolves Q39, where Bike Valet and Other events are stored but appear nowhere (EVT-4).

### HOME-7. Reorder and enrich the photo gallery
**Value: Medium · Effort: M · Needs: Code**
`components/photo-gallery.tsx` is a uniform grid of 4:3 crops, with no captions and no way to enlarge a photo. Tall photos are cropped through faces.
- Lead with the lake and mountain photos.
- Use a varied grid with one featured 2×2 tile, and add short captions ("Bike valet, Lakeview Commons").
- Consider an accessible lightbox (a native `<dialog>` with keyboard support) and a subtle hover zoom that respects reduced motion.
- The Baldwin Beach alt text is wrong (A11Y-14).

---

## 3. Content and information architecture

### CONT-1. Nonprofit trust signals
**Value: High · Effort: S · Needs: Board**
`/join` asks for money with no supporting information. There is no mention of 501(c)(3) status, an EIN, tax-deductibility, or how money is used, and there are no annual reports or financials. The footer says only "all-volunteer nonprofit". Add:
- A footer line: "LTBC is a 501(c)(3) nonprofit, EIN XX-XXXXXXX."
- On `/join`: "Donations are tax-deductible to the extent allowed by law."
- A short "Where your money goes" paragraph. Because LTBC is all-volunteer, nearly everything goes to programs, which is a strong message.
- A link to the latest annual summary or Form 990, if the board is willing.

### CONT-2. Partners and funders
**Value: Medium · Effort: S · Needs: Board**
The copy credits TRPA, the Tahoe Conservancy, local governments and others, and `public/images` already holds about a dozen unreferenced partner and sponsor logos (TRPA, League to Save Lake Tahoe, Tahoe Fund, South Shore Bikes, Cafe Disque, Pine Nut Cycle Cafe, Bike the West, Tahoe Brewfest 2025 and more). Q2 dropped the old `/sponsors` page because it was a TODO, but the need it served is real. Add a grayscale logo strip, either in the support band (GIVE-4) or on `/about`, with the current partners confirmed by the board.

### CONT-3. A "Plan your ride" page for visitors
**Value: High · Effort: M–L · Needs: Board (content)**
Visitors are a large share of Tahoe cyclists, but the site gives them a map link and nothing else. The old `/where-to-ride/` page was empty. A single page with five to eight signature rides (distance, difficulty, parking, surface, best season), the map embedded or previewed, rental shops, e-bike rules for California and Nevada, and a winter conditions note would make the site useful to a new audience. It would also attract search traffic and lead into membership.

### CONT-4. News and updates
**Value: Medium · Effort: M · Needs: Both**
Nothing on the site shows recent activity except the newsletter archive (four campaigns, no dates; Q27). Press, local government and potential donors look for recent activity. Options, cheapest first:
1. A "Recent news" list of the newsletter campaigns, with dates added by hand.
2. Short update pages written as code (one Markdown/MDX file per post, published by pull request, which matches the code-first model).
3. A database model, which needs the schema discussion.

Even one post a quarter is enough.

### CONT-5. List advocacy letters natively
**Value: Medium · Effort: M · Needs: Both**
`/advocacy` embeds a Google Drive folder iframe (`app/advocacy/page.tsx`). It is slow, it doesn't match the site's styling, nothing in it is indexable, and it shows only file names. Replace it with a list of letters (date, agency, project, one-line summary, PDF link), kept in a TypeScript array in the page. Keep a "Browse all letters on Google Drive" link as a fallback. This is also strong material for press and SEO.

### CONT-6. Rewrite the Bike Racks page around the offer
**Value: Medium · Effort: S · Needs: Board**
`app/bike-racks/page.tsx` opens with policy background (TRPA, the Trails and Bikeways Master Plan, the UC Davis study) before saying what a business can get. "Launched the Regional Bicycle Parking Program" appears twice (lines 57 and 71), and TRPA is never spelled out. While `rack_program_open` is off, the "now offers low or no-cost bike racks to businesses in Truckee" copy contradicts "not currently accepting applications".
- Lead with the offer, then eligibility and process, then a collapsible "Why bike parking matters".
- Use the past tense for the current round when the program is closed.
- State the geography plainly (Q17 is still open on whether rounds are Truckee-only).
- Replace the "email us and we'll let you know" dead end with a newsletter or interest signup and an expected window ("next round: spring 2027").
- Add a photo of an installed rack.

### CONT-7. Bike Valet page: request first, answers up front
**Value: Medium · Effort: S · Needs: Both**
On a phone the request form comes after all the photos and the volunteer section, while the copy says "fill out the request form below" (and on desktop the form sits beside the text, not below it).
- Add a "Request a valet" button near the top that jumps to the form.
- Add a short FAQ: lead time (the Google Form intro asks for a month's notice; Q16), minimum event size, what LTBC brings, and what the host provides.
- List a few past events served, as social proof.
- Merge the two near-duplicate h2s, "Volunteer" and "Questions or want to volunteer?".

### CONT-8. Volunteer page: explain the roles before the calendar
**Value: Medium · Effort: S · Needs: Both**
`/volunteer` is mostly a 1,650 px POINT iframe preceded by "Simply click the event, create a POINT account, and sign up for a shift!" It doesn't say what volunteers do, how much time it takes, or what to do if no shifts are listed.
- Add a short "Ways to help" list (valet attendant, Bike Kitchen mechanic, path cleanup, committees, board) with time commitments.
- Move the "Open the volunteer calendar on POINT" link above the iframe as a button (FORM-4).
- Add a line for when no shifts are listed, pointing to the volunteer email list.

### CONT-9. Trim the Newsletter page
**Value: Low · Effort: S · Needs: Code**
`app/newsletter/page.tsx` has generic filler blocks ("Newsletter Highlights", "Join the Community"), and the eyebrow, h1 and "Sign up!" repeat each other. Put the signup first, say how often the newsletter goes out and what's in it, then list the archive.

### CONT-10. About page: story, people, governance
**Value: Medium · Effort: S · Needs: Board**
`/about` has a two-sentence mission and the roster. Add:
- A short history: the founding year and a few milestones (map editions, the first valet, the rack program in 2018).
- A "Join the board" link (it exists only on `/join` today).
- How to reach the board.
- Whether meetings are open, and when they are.

Present the mission and vision as a styled pull-quote rather than run-in bold text (VIS-11).

### CONT-11. Contact page: route people to the right place
**Value: Low · Effort: S · Needs: Both**
The program-specific addresses (`bikekitchen@`, `bikevalet@`) appear only on their program pages. Add a small "Who to contact" table (general, Bike Kitchen, Bike Valet, press and partnerships), say roughly how quickly to expect a reply, and consider a topic select on the contact form so messages can be routed or labeled in the inbox.

### CONT-12. Bike Safety page updates
**Value: Low–Medium · Effort: S · Needs: Board**
- The helmet tip covers California law only, but half the lake is in Nevada. Add Nevada rules and California/Nevada e-bike classes.
- The heading "Ten more tips" reads oddly with no earlier list. "Ten tips for riding in Tahoe" is clearer.
- The two videos are titled "Bike Safe Lake Tahoe: spot 2" and "spot 1", in that order. Give them descriptive titles and visible captions, and put spot 1 first (A11Y-13).
- End with links to both maps, so the page leads somewhere (GIVE-4).

### CONT-13. Printable map page: where to get one
**Value: Low · Effort: S · Needs: Board**
"Available at all bike shops and visitor centers" could list actual pickup spots. Add a "Want to stock maps at your shop or lodging? Email us" prompt and a line crediting members ("free thanks to member support"), which links to `/join`.

### CONT-14. A yearly content freshness pass
**Value: Medium · Effort: S · Needs: Board**
Hard-coded claims will drift: "450 racks", "new interactive bike map", "New in 2026", board bios, the Bike Valet rate default. Add a short checklist to the migration plan or docs/TECHNICAL.md listing the claims to re-check each spring, before the summer season. Where a number is shown, give it an "as of" year. This is the "pages drift out of date" problem the migration was meant to fix, applied to the copy that now lives in code.

### CONT-15. Copy polish
**Value: Low · Effort: S · Needs: Code**
Use consistent hyphenation ("all-volunteer"), consistent apostrophes (`bike-kitchen` has straight quotes where other pages use curly ones), and consistent capitalization ("Helping Tahoe To Become More Bicycle Friendly" appears in title case in places). Remove the "What we do" blocks on `/programs` that repeat the cards above them, and define "LTBC" at first use on each page. Do this pass together with NAV-6.

---

## 4. Membership, donations, newsletter

### GIVE-1. Say what each membership tier gets
**Value: High · Effort: S · Needs: Board**
`app/join/page.tsx` shows each tier as "Individual – $20" followed by a "Join for $20 / Year" button. The price is repeated, and there is no word on what membership includes. One real benefit is already promised elsewhere: business members may get the bike valet at a discount (`app/bike-valet/page.tsx:78`), but `/join` doesn't mention it.
- Add two or three bullets per tier (for example: support the free map, voting at the annual meeting if applicable, the valet discount and a listing for businesses).
- Say who the Family tier covers.
- Show each price once.

### GIVE-2. Simplify the donation panels
**Value: High · Effort: M · Needs: Both**
Each of the two donation panels has a fixed "One Time Donation" button and, below it, a separate "Amount in USD" field with a "Contribute now" button. These are two controls for the same action. The recurring panel doesn't say how often it charges (the admin help text says monthly; the page says nothing). There are no suggested amounts and no `$` prefix, and the placeholder ("Choose what you pay") disagrees with the label.
- Replace both with one panel: a one-time / monthly toggle, preset amounts ($25, $50, $100, $250), and an "Other" field with a `$` prefix.
- Add a sentence of impact framing per amount if the board can supply it ("$50 buys tubes and brake pads for a Bike Kitchen night").

Check what Memberful's checkout URL parameters allow before designing the preset buttons.

### GIVE-3. Prepare people for the Memberful hand-off
**Value: Medium · Effort: S · Needs: Code**
The join and donate buttons open `tahoebike.memberful.com` in a new tab, and only screen-reader users are told so. Add a visible line under the buttons ("Secure checkout on Memberful, opens in a new tab") and the external-link icon from NAV-4.

### GIVE-4. "Support the Coalition" band above the footer
**Value: High · Effort: S–M · Needs: Code**
Q28 left the old Divi "Support the Coalition" section unported. Today most pages end abruptly: Bike Safety after tip 10, Advocacy at the iframe, About at the advisors. Add a shared `<SupportBand>` before the footer: a full-bleed photo (Bike Kitchen or valet), one sentence, a primary Donate button and secondary Join and Volunteer links. Hide it on `/join` and the admin pages. It is the cheapest way to put a giving prompt on every page.

### GIVE-5. One-step newsletter signup
**Value: High · Effort: M · Needs: Both (Constant Contact access)**
The newsletter form sends visitors to Constant Contact's hosted page, which ignores the email they typed, so they type it again on a page that doesn't match the site (Q27). A server action calling Constant Contact's `sign_up_form` API (Q26 option a) fixes the newsletter and the volunteer list together, and lets the site show its own "Check your inbox to confirm" message.
**Until then:** add helper text under the field ("You'll confirm on our email provider's page"), and consider pointing `constant_contact_signup_url` at the newer landing page recorded in Q27.

---

## 5. Forms and interactive flows

### FORM-1. Make sure contact messages reach a person
**Value: High · Effort: S · Needs: Code (plus checking production settings)**
`handleSubmission` in `lib/forms/actions.ts` stores the submission, then tries to send the notification. If the send fails it logs the error and still returns success. Without `RESEND_API_KEY` the provider is the console logger, so on Vercel the "notification" is a log line, and the visitor still reads "We will get back to you soon." The same happens if Resend rejects an unverified sender domain. The admin inbox keeps everything, but nobody is prompted to look at it.
- Confirm Resend and the sender domain are configured in production (this is already an inbox item in `TASKS.md`).
- Log at error level in production when the key is missing.
- Show a "Email delivery is not configured" or "N notifications failed" warning on the admin dashboard (ADMIN-4).

### FORM-2. Handle Turnstile edge cases
**Value: Medium · Effort: S · Needs: Code**
`components/forms/turnstile-widget.tsx` renders the widget with no `expired-callback` or `error-callback`, and the submit button is enabled before a token exists.
- **Expired token:** tokens last about five minutes, so a visitor who takes longer to write a message gets "We could not verify that you are a person" on submit.
- **Blocked script:** if an ad blocker stops the script, the form can never be submitted, and the error gives no way out.
- **No JavaScript:** visitors without JS can't pass the check at all.
- **Missing site key:** because the key is `NEXT_PUBLIC_*`, it only takes effect after a redeploy. If the secret is set but the site key is missing, every submission is rejected.

Fixes:
- Add expired and error callbacks that reset the widget and show a `role="alert"` note with the mailto address.
- Show a "Verifying…" state until a token exists.
- Add a `<noscript>` line with the email address.
- Document the redeploy requirement in docs/TECHNICAL.md.

### FORM-3. Announce validation errors and move focus to them
**Value: High (for form users) · Effort: M · Needs: Code**
In `components/forms/fields.tsx`, field errors are plain paragraphs, correctly linked with `aria-describedby` and `aria-invalid`. Only the form-level error has `role="alert"`. After a failed submit, focus stays on (or falls off) the submit button, so a screen-reader user hears nothing and a keyboard user has to hunt for the errors. Invalid fields have no visual treatment other than red text below them.
- Render an error summary at the top ("2 problems: Email, Message"), linking to each field, and focus it.
- Give invalid fields a red border and an icon.

This applies to the contact form now, and to the valet and rack forms if they go native.

### FORM-4. Tame the Google Form and POINT iframes
**Value: Medium · Effort: S–M · Needs: Code**
`components/google-form-embed.tsx` defaults to a fixed `height = 3250`, and `/volunteer` hard-codes the POINT iframe at 1,650 px. On a phone, at high zoom, or when the embedded page re-wraps, the result is a scroll area inside the page or a long blank tail. Keyboard users have to tab through the whole iframe to get past it.
- Move the "open in a new tab" fallback above each frame and style it as a button.
- Add a "Skip the form" link after each frame.
- Set responsive heights measured at 360 px and 1280 px.
- Longer term, switch to the native valet and rack forms (Q16 and Q17 list the fields to add first). Native forms reflow, match the site, and land in the admin inbox.

### FORM-5. Acknowledge submissions properly
**Value: Medium · Effort: S · Needs: Both**
The contact success message ("Thanks for your message. We will get back to you soon.") gives no idea of response time, and the sender gets no copy of their message. Add a realistic response time to the success text, and optionally send an acknowledgement email through the existing `EmailProvider`, including a copy of the message.

### FORM-6. Smaller form refinements
**Value: Low · Effort: S · Needs: Code**
- Keep the submit button focusable while it is pending: use `aria-disabled` and a click guard instead of `disabled`, and announce "Sending…" in a live region (A11Y-15).
- Reconsider whether the valet form's phone field needs to be required.
- Add a per-IP rate limit and duplicate detection to the form actions, since a reload after success can resubmit. Low priority while the honeypot and Turnstile are holding up.

---

## 6. Events and announcements

### EVT-1. Bike Kitchen schedule runs out on October 21
**Value: High · Effort: S · Needs: Board**
The seeded Bike Kitchen events end with the October 21 2026 fix-up at the South Lake Tahoe Library. After that, `/bike-kitchen` shows the plain "No upcoming events are scheduled" paragraph. Enter the winter schedule at `/admin/events`, or, if there are no winter fix-ups, make the empty state say so (EVT-2).

### EVT-2. A useful empty state for events
**Value: Medium · Effort: S · Needs: Code**
The empty state in `components/event-list.tsx` links "subscribe to our newsletter" to `/join` instead of `/join#newsletter`. It doesn't say how often fix-ups happen, or how to donate or request a bike in the meantime.
- Use the anchor.
- Add a cadence line ("Fix-ups run roughly monthly from spring through fall").
- Point to the Bike Kitchen email for donations and requests.
- Style it as a dashed-border card with the bike icon, so an empty schedule looks intentional rather than broken.

### EVT-3. Add to calendar, with the time zone shown
**Value: Medium · Effort: M · Needs: Code**
Event cards show a date, a time range in Pacific time with no zone label, and a Google Maps link. Add "PT" to the time. Add an "Add to calendar" control: a Google Calendar template link, and an `.ics` route handler built from the `Event` row.

### EVT-4. Show events from every program (Q39)
**Value: Medium · Effort: M · Needs: Code**
Only `/bike-kitchen` calls `getUpcomingEvents`. Bike Valet and Other events can be created in the admin but appear nowhere, and `revalidateEvents` purges `/bike-valet` even though that page lists no events. Add the homepage "Coming up" strip (HOME-6) and a "Where to find the valet" list on `/bike-valet`. Alternatively, trim the enum, as Q39 suggests.

### EVT-5. Specific registration labels
**Value: Low · Effort: S · Needs: Code**
Every event with a `registrationUrl` gets an identical "Sign up" button. Add sr-only text with the event title, and say where the link goes ("Sign up on POINT"), either inferred from the URL host or set by an optional label field.

### EVT-6. A dismissible banner, with a tone for urgent notices
**Value: Medium · Effort: M · Needs: Code (schema change for severity)**
`components/announcement-banner.tsx` is always safety yellow, can't be dismissed, and its link always reads "Learn more" (A11Y-7). Only the newest active announcement is shown, so overlapping announcements are silently hidden.
- Add a dismiss button: a small client island that stores the dismissed announcement id in `localStorage`, inside try/catch.
- Use the message itself, or admin-supplied text, as the link name.
- Warn in the admin when two announcements overlap.
- Optionally add a severity field (urgent notice versus promotion). That one is a schema change.

### EVT-7. A past events record
**Value: Low · Effort: S · Needs: Code**
Events disappear once they end. A collapsed "Past fix-ups this year" list on `/bike-kitchen` shows the program is active, and costs one query.

---

## 7. Visual design and brand

Background: the theme tokens in `app/globals.css` match the brand guide (`reference/LTBC-brand-guide.pdf`): Asphalt #201800, Safety Yellow #FFDF00, Blue Bird #52B9E9 and Tahoe Blue #1598CB, with heading and body letter-spacing that match the guide. The accessible `tahoe-deep` variant for text is a good call. The ideas below build on that foundation.

### VIS-1. A shared page header for interior pages
**Value: High · Effort: M · Needs: Code**
Each page builds its own h1 and intro inside `mx-auto max-w-4xl px-4 py-12`, so every interior page opens as black text on white. A `<PageHeader>` component would carry the visual weight in one place: title, optional subtitle, optional photo band or a yellow band with the dashed-line motif, and optional breadcrumb (NAV-10). Use it on About, Programs, Bike Kitchen, Bike Valet, Bike Racks, Bike Safety, Advocacy, Volunteer, Join and Contact. This one change does the most to lift the weakest pages.

### VIS-2. Icons and brand motifs
**Value: Medium–High · Effort: M · Needs: Code**
The UI has no icons; the only glyph is a "▾" character in the nav. The brand guide supplies a dashed yellow line, a bicycle line icon and a diamond sunset-lake-bike emblem, and none of them appear in the page UI.
- Use the dashed line as a section divider and as a short underline under headings.
- Use the bike icon for empty states and the 404 page.
- Use the emblem as a faint watermark in the footer.
- Add a small inline-SVG icon set (map, calendar, wrench, parking, shield, heart, mail, external link, Facebook, Instagram) for program cards, event cards, contact details and social links. Keep it as hand-written SVG components rather than an icon library, per the "keep dependencies minimal" convention.

### VIS-3. Program cards with photos
**Value: Medium · Effort: M · Needs: Code**
`components/program-cards.tsx` renders bordered boxes with a heading, a blurb and a button. Add a 16:9 photo to each card from the existing library (for example `IMG_3110.jpg` for the Bike Kitchen and `bike_valet2.jpg` for the valet), make the whole card clickable, and add a hover lift. A colored top border per program is optional. Turn the text-only "What we do" `<dl>` on `/programs` into icon rows, or remove it (CONT-15).

### VIS-4. Use more of the palette
**Value: Medium · Effort: S · Needs: Code**
Blue Bird appears only as faint placeholder backgrounds behind images (`bg-bluebird/20`), and Tahoe Blue only as 10–15% tints. Pages are long white stretches broken by one yellow strip. Alternate section backgrounds (white, a pale Blue Bird tint, a photo band, asphalt) to give long pages rhythm, and keep yellow for actions (HOME-3).

### VIS-5. Heading typography
**Value: Medium · Effort: S · Needs: Code (Board for the font licence)**
`app/globals.css` makes every h1–h4 uppercase with 0.1em tracking, as the brand guide says. Long headings ("Stay Informed with the Lake Tahoe Bicycle Coalition"), event titles and people's names on `/about` become hard to scan in tracked capitals, which also hurts readability for dyslexic readers.
- Keep caps for h1, h2 and short card titles.
- Use heavy sentence case with lighter tracking for h3 and h4 in prose, event titles and names.
- Add `text-wrap: balance` to headings.
- Load Libre Franklin's 900 weight for display sizes, to get closer to Franklin Gothic ATF Heavy.

If LTBC has Adobe Fonts access (Q6), the real typeface is a one-line change, because it is already first in the font stack.

### VIS-6. Comfortable line length
**Value: Medium · Effort: S · Needs: Code**
`.prose-ltbc` has no maximum width, and pages mix `max-w-3xl`, `4xl` and `6xl` containers, so some paragraphs run past 100 characters per line. Cap running text at about 65ch and use `leading-relaxed` for body copy.

### VIS-7. One card style
**Value: Low–Medium · Effort: S · Needs: Code**
Corner radii vary (`rounded-lg` on cards, `rounded-md` on buttons and gallery tiles, `rounded` on inputs and dropdowns), as do borders (`border-asphalt/10` against `/15`). Only the nav dropdown has a shadow. Define radius, border and shadow tokens in `@theme`, plus a `.card` class used by hero cards, program cards, event cards, the board roster and the join tiers. Add a `<Section>` wrapper for consistent vertical spacing between page sections.

### VIS-8. Micro-interactions
**Value: Medium · Effort: S · Needs: Code**
The only transition on the site is `transition-colors` on buttons, and the primary button's hover only changes its border color, which is nearly invisible on yellow. Add:
- A visible hover on primary buttons (darker fill or a shadow) and a pressed state.
- A hover lift on cards.
- A slow zoom on hovered photos.
- An arrow that nudges on primary calls to action.
- A short fade and slide when dropdowns open, with a chevron that rotates.

Gate all motion on `prefers-reduced-motion` (A11Y-10).

### VIS-9. More imagery on text-heavy pages
**Value: Medium · Effort: M · Needs: Both (photos)**
Bike Racks, Bike Safety, Advocacy, Volunteer, Contact and Newsletter are mostly text with one image or none.
- **Bike Safety:** the ten tips as icon cards.
- **Bike Racks:** a photo of an installed rack, and the 450/900/8 numbers as large stat callouts.
- **Advocacy:** a header photo and the letter list from CONT-5.
- **Contact:** the unused `Bike-contact.png` (1489×767).

Ask the board for recent event photos. Most of the library dates from 2022.

### VIS-10. Header and mobile menu polish
**Value: Low–Medium · Effort: S · Needs: Code**
- Replace the "▾" glyph with an SVG chevron that rotates when the menu opens.
- Give the mobile "Menu" button a hamburger icon, and open the menu as a slide-down panel rather than a plain list.
- Make the active page visible (NAV-3).
- Export the logo from `reference/logos/Primary Logo/LTBC-Logo.ai` or `.pdf` as an SVG, so it is sharp at any size and skips the image optimizer.
- Keep the brand's clear space around the logo (the guide specifies it; the header uses `gap-4 px-4 py-3`).

*Status (October 2026):* the SVG chevron (rotates on open) and the hamburger and close icons are done in the navigation PR. No slide-down panel or SVG logo yet.

### VIS-11. About page styling
**Value: Low–Medium · Effort: S · Needs: Code**
- Make the About banner full-bleed.
- Set the mission and vision as two large pull-quote blocks, one Tahoe Blue and one yellow.
- Crop the board headshots to matching circles with a thin safety-yellow ring.
- Put the brand tagline ("We strive to advocate on behalf of cyclists for better infrastructure and safety improvements"), unused today, on this page or in the support band.

### VIS-12. Print styles, especially for the printable map
**Value: Medium · Effort: S · Needs: Code**
No `print:` styles exist. Printing `/print-bike-map` includes the banner, header, footer and buttons. Add an `@media print` block:
- Hide site chrome and buttons.
- Show the map images full width with `break-inside: avoid`.
- Set `@page { size: landscape }`, since the maps are landscape.
- Print the map URL after its link.

This also helps anyone who prints `/bike-safety`.

### VIS-13. Favicon and share images
**Value: Low–Medium · Effort: S–M · Needs: Code**
- **Favicon:** `app/icon.png` is the detailed diamond emblem, which will blur at 16 and 32 px. Use a simplified high-contrast mark at small sizes, such as the bike on a yellow square.
- **Default share image:** done (Oct 25 2026). The OG image (`app/opengraph-image.tsx`) now embeds Libre Franklin ExtraBold instead of faking bold with a text shadow (Q35).
- **Per-page share images:** `/bike-kitchen` uses a raw ~500 KB photo with no declared dimensions. Pre-cropped 1200×630 photo images for the main program pages would make shared links far more appealing; `pageMetadata` already accepts an image.

### VIS-14. Sense of place and seasonal touches
**Value: Low–Medium · Effort: M · Needs: Code**
Small Tahoe-specific touches would make the site feel local rather than generic:
- A faint topographic-contour pattern in Blue Bird behind some sections.
- A mountain skyline silhouette above the footer.
- A wave-shaped divider under the hero.
- A hero photo that changes with the season (summer lake, autumn, a winter "bike to ski" shot if a large enough photo exists).

### VIS-15. Dark mode: not recommended
**Value: Low · Effort: M · Needs: Code**
The brand is built around yellow on asphalt and white, and a dark theme isn't worth the effort for this site. Do declare `color-scheme: light` on `html`, so form controls and scrollbars render consistently for visitors whose system is in dark mode.

---

## 8. Accessibility

What is already right: `lang="en"`, a working skip link, one `<main>`, one h1 per page with no skipped heading levels, descriptive page titles, good alt text on content images, underlined links, labelled form fields with `aria-describedby` and `aria-invalid`, a success message that takes focus, a honeypot hidden from assistive technology, new-tab warnings for screen readers, titled lazy-loaded embeds, no carousels or autoplay, and nav menus built on `<details>` so they work without JavaScript and close on Escape.

Measured contrast: asphalt on white is 17.6:1, `tahoe-deep` links on white are 5.30:1, and asphalt on yellow is 13.3:1. The three failures are below.

### A11Y-1. Form input borders are too faint
**Value: High · Effort: S · Needs: Code**
`.field-input` uses `border-asphalt/40`, which blends to #8e8a80. That is 2.52:1 against white, and WCAG 1.4.11 requires 3:1 for the edges of controls. Every text field, select, textarea and the donation amount field is affected. (The newsletter field already overrides to `/60`.) Change the base class to `border-asphalt/60` (about 4.6:1) or darker.

### A11Y-2. The focus ring disappears on yellow
**Value: High · Effort: S · Needs: Code**
`:focus-visible` uses `outline-tahoe` (#1598CB): 3.29:1 on white and 5.36:1 on asphalt, both passing, but 2.48:1 on safety yellow. The skip link, the announcement banner link and the whole newsletter panel (email field, Subscribe button, archive link) sit on yellow. Use a two-tone ring that works on any background, such as a 2 px asphalt outline with a white outer shadow, or an asphalt ring everywhere (17:1 on white, 13:1 on yellow).

### A11Y-3. A link on the yellow panel fails text contrast
**Value: Medium · Effort: S · Needs: Code**
"Read past newsletters here" inside the yellow newsletter panel inherits `tahoe-deep`, which is 3.99:1 on #FFDF00 (4.5:1 needed). Make links on yellow asphalt, as `announcement-banner.tsx` already does, ideally through one rule for links on yellow backgrounds.

### A11Y-4. Close menus on navigation
See NAV-2. For screen-reader and keyboard users, the open menu and the unmoved focus give no sign that the page changed.

### A11Y-5. Current page in the nav
See NAV-3.

### A11Y-6. Form error announcement and focus
See FORM-3.

### A11Y-7. Generic link and button names
**Value: Medium · Effort: S · Needs: Code**
In a screen reader's list of links, these all read the same with no context:
- The banner's "Learn more" (`components/announcement-banner.tsx`).
- Each event's "Sign up" (`components/event-list.tsx`).
- The hero cards' admin-entered CTAs.
- "Sign up", "Subscribe" and "Email us" on `/join`.

Reuse the pattern `program-cards.tsx` already follows: append the item's title in an sr-only span. Add a note to the admin card form asking for specific button text.

### A11Y-8. Duplicate map links on the homepage
**Value: Low–Medium · Effort: S · Needs: Code**
The map screenshot and the "Explore the map" button are adjacent links to the same URL, and the image link is named "Screenshot of the interactive Lake Tahoe Bikeways Map". Either take the image link out of the tab order (`tabIndex={-1}`, `aria-hidden`), or name it for its destination.

### A11Y-9. Board names are read twice
**Value: Low–Medium · Effort: S · Needs: Code**
`components/board-roster.tsx` uses `alt={member.name}` directly above an `<h3>` with the same name. Use `alt=""`, since the photo sits beside the name.

### A11Y-10. Respect reduced motion
**Value: Low–Medium · Effort: S · Needs: Code**
`html { scroll-behavior: smooth }` in `app/globals.css` applies to everyone. Wrap it in `@media (prefers-reduced-motion: no-preference)`, and apply the same guard to any motion added under VIS-8.

### A11Y-11. Footer landmarks and headings
**Value: Low · Effort: S · Needs: Code**
The footer has three `<nav>` landmarks labelled "About", "Resources" and "Get Involved", and adds h2s to every page's outline. On `/about`, the footer's "Lake Tahoe Bicycle Coalition" h2 repeats the page's own heading. Use a single `<nav aria-label="Footer">` (NAV-7).

### A11Y-12. 404 page title
See NAV-9.

### A11Y-13. Descriptive embed titles
**Value: Low–Medium · Effort: S · Needs: Code**
The YouTube iframes are titled "Bike Safe Lake Tahoe: spot 2" and "spot 1" (`app/bike-safety/page.tsx:95-96`) and "Bike Kitchen video" (`app/bike-kitchen/page.tsx:122`). Use the videos' real subjects, and add a visible caption or a transcript link.

### A11Y-14. Fix the alt text problems already logged in Q29
**Value: Medium · Effort: S · Needs: Code**
Q29 lists known errors, still open:
- **Baldwin Beach:** the alt describes cyclists on a path, but the photo shows bikes parked on the sand.
- **Bike Valet header graphic:** its embedded text ("Lots and lots of bike parking") is missing from the alt.
- **Patriotic tandem:** the description of the bike is wrong.
- **Path cleanup:** the alt mentions rakes that aren't in the photo.
- **Map card:** the homepage "Tahoe Bike Map" card image is the map itself, but it is marked `alt=""`.

Fix these and regenerate `docs/IMAGE_INDEX.md`.

### A11Y-15. Keep the submit button focusable while sending
See FORM-6.

### A11Y-16. Larger touch targets
**Value: Low–Medium · Effort: S · Needs: Code**
Footer links are exactly 24 px tall, the WCAG 2.2 minimum, so any reduction would fail. Nav links are about 40 px. Raise nav links, footer links and the checkbox to about 44 px (`min-h-11`, `py-2.5`, `h-6 w-6`).

*Status (October 2026):* header links and the Donate button are at least 44 px tall (`min-h-11`) in the navigation PR. Footer links and the checkbox are still open.

### A11Y-17. Alt text for meaningful homepage card images
**Value: Low · Effort: M · Needs: Code (schema change)**
Hero card images are always decorative (`alt=""`). An optional alt field on `HomepageCard` would let admins describe images that carry meaning, such as the map card. This is a schema change.

### A11Y-18. Automated accessibility checks in CI
**Value: Medium · Effort: M · Needs: Code**
CI runs typecheck and lint only. Add Playwright with `@axe-core/playwright` against a build of the public pages to catch contrast, naming and landmark regressions as design work (Phase 6) speeds up. This is a dev dependency only. Pair it with one manual VoiceOver pass before cutover.

---

## 9. Performance

What is already right: about 185 KB of gzipped JavaScript on the homepage, only six client components, `next/image` with sensible `sizes` everywhere and no layout shift from images, a self-hosted font with `display: swap`, static pages with ISR served from the edge cache, a preloaded logo, `priority` on interior banner images, lazy-loaded embeds, and Turnstile loaded only on form pages.

### PERF-1. Measure real-world performance and use
**Value: High · Effort: S · Needs: Both (privacy policy wording)**
There is no field data: no analytics, no Speed Insights, no error monitoring. So far nobody can tell which pages people use, where they leave, or whether design changes help. Vercel Speed Insights and Web Analytics are cookieless, and each is a single component in `app/layout.tsx`. The privacy policy (`app/privacy-policy/page.tsx:209-212`) promises "no analytics", so update it in the same pull request and get the board's approval for the wording.

### PERF-2. Serve AVIF
**Value: Medium · Effort: S · Needs: Code**
`next.config.ts` leaves `images.formats` at the default, so photos are served as WebP. Adding `formats: ['image/avif', 'image/webp']` typically cuts photo bytes by 20–30%, at the cost of slower first encodes and more image transformations against the Vercel plan's quota.

### PERF-3. Fewer image widths
**Value: Medium · Effort: S · Needs: Code**
Every `fill` image emits the full default width list in its srcset, up to a 3840 px fallback. That makes the HTML larger (`/about` is 78 KB uncompressed) and multiplies the transformations to generate and cache. Set `deviceSizes` to about `[360, 414, 640, 768, 1024, 1280, 1600]` and `imageSizes` to about `[96, 144, 256, 384]`.

### PERF-4. Longer browser cache for optimized images
**Value: Medium · Effort: S · Needs: Code · (verify)**
The one `/_next/image` response checked had `cache-control: public, max-age=0, must-revalidate`. Images in `public/` never change in place (docs/TECHNICAL.md forbids renaming or editing them), so `images.minimumCacheTTL` can be long (for example 31536000). Retest the headers afterwards, since only one response was sampled.

### PERF-5. Don't cache a page built during a database error
**Value: Medium · Effort: S · Needs: Code**
`getHomepageCards()` in `app/page.tsx`, the announcement banner and the settings loader catch database errors and render without the data. docs/TECHNICAL.md notes this is deliberate, so builds survive a missing database. At runtime, though, a transient error during revalidation produces a page with no cards or banner, and that page is cached for five minutes. Rethrow during runtime revalidation, so Next.js keeps serving the last good page. Keep the fallback only for the build.

### PERF-6. Click-to-load embeds
**Value: Medium · Effort: M · Needs: Code**
The YouTube iframes (`/bike-kitchen`, `/bike-safety`) and the Google Drive folder (`/advocacy`) are lazy, but each pulls hundreds of kilobytes of third-party code once scrolled near. Show a thumbnail with a play button, and load the iframe on click; the thumbnail comes from `i.ytimg.com`, with no cookies. The Drive folder goes away with CONT-5.

### PERF-7. Homepage loading priority and placeholders
**Value: Low–Medium · Effort: S · Needs: Code**
On a phone the first homepage card image is near the fold but lazy-loaded. Give the hero photo (HOME-1) `priority`, and make the first card eager. No image uses `placeholder="blur"`, so photos pop in over a grey box. Add blur placeholders for static imports, or a brand-tint background.

### PERF-8. Load Turnstile on demand
**Value: Low · Effort: S · Needs: Code**
Load the Turnstile script when a visitor first focuses the form, rather than on page load. This keeps about 100 KB of Cloudflare script and a hidden iframe out of the way of `/contact` loading and responsiveness. Combine with FORM-2.

### PERF-9. Image hygiene
**Value: Low · Effort: S · Needs: Code**
`public/images` is about 20 MB. Several originals are still 700 KB to 1.3 MB (`Cove-East-Rack-2.jpg`, `LTBC_SouthLake-2023-Print.png`, `Bike-contact.png`), and there are two near-duplicate `Baldwin-Beach.jpg` files in different months. Visitors only receive optimized copies, but the originals feed OG images (VIS-13) and slow cold optimizer misses. Run `pnpm content:optimize --all` and remove unreferenced duplicates, after checking `docs/IMAGE_INDEX.md`.

### PERF-10. A performance and accessibility budget in CI
**Value: Low–Medium · Effort: M · Needs: Code**
Lighthouse CI, or the same Playwright setup as A11Y-18, run against preview deployments, with thresholds for LCP, CLS, total JavaScript and accessibility score. That way Phase 6 design pull requests can't quietly regress.

---

## 10. Responsiveness and mobile

The layout is mobile-first and sound: `max-w-6xl px-4` containers give a 16 px gutter at 320 px, the header wraps, card grids collapse cleanly, and there are no tables to overflow. The mobile issues are mostly covered in other sections:

- **Iframes:** fixed heights cause nested scrolling (FORM-4).
- **Bike Valet:** the request form comes last on a phone (CONT-7).
- **Navigation:** the menu stays open after navigating (NAV-2); the header is not sticky (NAV-8); touch targets are small (A11Y-16).

### RESP-1. A device test pass before cutover
**Value: Medium · Effort: S · Needs: Code**
Nothing has been checked on real devices. Before DNS cutover:
- Check every public page at 320, 375, 768 and 1280 px, plus a phone in landscape.
- Look for long unbroken strings (email addresses and URLs in the footer, contact page and board bios) that need `break-words`.
- Check that the expanded mobile menu scrolls in landscape.
- Watch the embedded forms at narrow widths.

Save the screenshots in the preview pull request.

### RESP-2. Brand color in the mobile browser bar
**Value: Low · Effort: S · Needs: Code**
No `theme-color` is set. A `viewport` export with `themeColor: "#FFDF00"` (or asphalt) colors the browser chrome on mobile Chrome and Safari. A full web app manifest isn't worth adding.

---

## 11. SEO and discoverability

What is already right: titles and descriptions on every page, canonical URLs through `pageMetadata()`, Open Graph and Twitter tags, a sitemap with every public page, robots.txt excluding `/admin` and `/api`, real 404 status codes, and 341 permanent redirects from WordPress URLs.

### SEO-1. Structured data
**Value: High · Effort: M · Needs: Code**
The site has no JSON-LD. Add:
- **`NGO` / `Organization` on the homepage:** name, logo, address (PO Box 1147, Zephyr Cove), `sameAs` links to Facebook and Instagram.
- **`Event` in `EventList`:** title, start, end, location and `registrationUrl` are already on every row. Google's event results need little more.
- **`BreadcrumbList` on program pages.**

Render the JSON in a `<script type="application/ld+json">` with `<` escaped.

### SEO-2. Titles that match what people search for
**Value: Medium · Effort: S · Needs: Code**
"Bike Racks", "Contact", "Newsletter" and "Volunteer" are accurate but generic, and the homepage title is just the organization name. Without stuffing keywords, consider "Tahoe Bike Map & Bike Programs | Lake Tahoe Bicycle Coalition" for the homepage, "Bike Valet Parking for Tahoe Events", "Free and Low-Cost Bike Racks for Tahoe Businesses", and so on. Revisit the Bike Racks description while the program is closed.

### SEO-3. Honest sitemap dates
**Value: Low · Effort: S · Needs: Code**
`app/sitemap.ts:25` stamps every URL with `new Date()` on every request, so every page always looks freshly changed, and search engines learn to ignore the date. Use a build-time date, the most recent `updatedAt` for pages that read from the database, or leave `lastModified` out.

### SEO-4. Keep the `vercel.app` host out of search results
**Value: Medium · Effort: S · Needs: Code**
`https://tahoebikeorg.vercel.app` returns no `x-robots-tag`, and its robots.txt allows crawling, so the whole site can be indexed there as a duplicate. The canonical tags point at `tahoebike.org`, which mitigates this, but before cutover that domain still serves WordPress. Send `X-Robots-Tag: noindex` whenever the request host isn't the canonical domain: through a `headers()` rule with a `has: host` condition, or in `proxy.ts` if Q34 adds one.

### SEO-5. Script the redirect check for cutover
**Value: High (at cutover) · Effort: M · Needs: Code**
The 341 rules in `lib/redirects.ts` have been tested by hand. A script that reads the WordPress sitemap (or the export's URL list), requests each URL on the preview deployment and asserts one 308 followed by a 200 would make the DNS cutover safe and repeatable. Include `/wp-content/uploads/...` image URLs, `?p=`/`?page_id=` links, and the press-cited `/bike-month-leaderboard/` (Q2 is still open on whether that should land on `/leaderboards`).

---

## 12. Trust, security and operations

### OPS-1. Basic security headers
**Value: Medium · Effort: M · Needs: Code**
Responses carry HSTS and nothing else.
- **Now:** add `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and `frame-ancestors 'self'` in `next.config.ts` `headers()`.
- **Then:** a `Content-Security-Policy-Report-Only` header that allows Turnstile, `youtube-nocookie.com`, `docs.google.com`/`drive.google.com`, POINT and Vercel Blob. Make it enforcing once the reports are clean.

None of this is visible to visitors, but it protects them, and it is expected of a site that takes personal data.

### OPS-2. Error monitoring
**Value: Low–Medium · Effort: S–M · Needs: Code**
Server action failures (email sends, database errors) go only to Vercel's function logs, which nobody watches. A log drain, or a lightweight error tracker with an email alert, would surface FORM-1-type failures quickly. Mention it in the privacy policy if it handles personal data.

---

## 13. Admin features that keep public content fresh

These are admin changes, but each prevents stale or broken content on the public site.

### ADMIN-1. Expiry windows and reminders
**Value: Medium · Effort: M · Needs: Code (schema change)**
Announcements expire on their own, but homepage cards (HOME-2) and the bike rack program flag do not. Two additions:
- Show-from and show-until dates for cards.
- An optional "applications close on" date that turns `rack_program_open` off automatically, with the flag also shown on the admin home page rather than buried among about 25 settings.

Both are schema changes.

### ADMIN-2. Catch event entry mistakes
**Value: Low–Medium · Effort: S · Needs: Code**
An event saved with a past date, from a mistyped year for example, vanishes from the public page immediately and without comment. Warn when an event's end is in the past. Prefill the end date from the start date, with a default two-hour duration.

### ADMIN-3. "View on site" and status badges
**Value: Medium · Effort: S · Needs: Code**
After a save, show a link to the public page that changed. In the event, announcement and card lists, show "Scheduled", "Live" or "Expired" badges, so admins can see at a glance what the public sees.

### ADMIN-4. A configuration health panel
**Value: Medium · Effort: S · Needs: Code**
On the admin home page, show whether email delivery (Resend), spam protection (Turnstile, both keys), image uploads (Blob) and Google sign-in are configured, and how many notifications have failed recently. That turns the `TASKS.md` question "Forms and emails that don't work?" into something visible at a glance. Show the warnings without revealing any secrets.

---

## Ideas that need board input

These can't move without content, numbers or a decision from LTBC:

- **HOME-1:** a one-line description of what LTBC does.
- **HOME-2:** current homepage card copy.
- **HOME-5:** impact numbers.
- **CONT-1:** EIN, 501(c)(3) wording, how money is used, financials.
- **CONT-2:** a confirmed partner list.
- **CONT-3:** rides and visitor information.
- **CONT-4:** news posts.
- **CONT-6:** the rack program's geography and next round.
- **CONT-7:** the valet FAQ and past events.
- **CONT-8:** volunteer roles.
- **CONT-10:** history, meetings, a board contact.
- **CONT-12:** Nevada rules.
- **CONT-13:** map pickup locations.
- **CONT-14:** an annual review owner.
- **NAV-6:** canonical names.
- **GIVE-1:** membership benefits.
- **GIVE-2:** donation amounts and impact framing.
- **GIVE-5:** Constant Contact API access.
- **EVT-1:** the winter fix-up schedule.
- **PERF-1:** approval to change the privacy policy.
- **VIS-5:** Adobe Fonts access.
- **VIS-9:** recent photos.

## All ideas by value

| Value | Ideas |
|---|---|
| **High** | NAV-1 Donate button · NAV-2 close menus on navigation · NAV-4 promote the bike map · HOME-1 photo hero · HOME-2 seasonal cards · HOME-5 impact strip · CONT-1 trust signals · CONT-3 plan your ride · GIVE-1 tier benefits · GIVE-2 donation panels · GIVE-4 support band · GIVE-5 one-step newsletter · FORM-1 email delivery · FORM-3 form errors · EVT-1 Bike Kitchen schedule · VIS-1 page header · A11Y-1 input borders · A11Y-2 focus ring · PERF-1 analytics · SEO-1 structured data · SEO-5 redirect check |
| **Medium** | NAV-3 current page · NAV-5 rename "Learn More" · NAV-6 naming · NAV-7 footer · NAV-9 404 page · HOME-3 CTA hierarchy · HOME-4 map feature · HOME-6 coming up · HOME-7 gallery · CONT-2 partners · CONT-4 news · CONT-5 advocacy letters · CONT-6 Bike Racks rewrite · CONT-7 Bike Valet · CONT-8 Volunteer · CONT-10 About · CONT-14 freshness pass · GIVE-3 Memberful hand-off · FORM-2 Turnstile · FORM-4 iframes · FORM-5 acknowledgement · EVT-2 empty state · EVT-3 add to calendar · EVT-4 all programs' events · EVT-6 banner · VIS-2 icons and motifs · VIS-3 program cards · VIS-4 palette · VIS-5 typography · VIS-6 line length · VIS-8 micro-interactions · VIS-9 imagery · VIS-12 print styles · A11Y-3 link on yellow · A11Y-7 link names · A11Y-14 alt text · A11Y-18 a11y CI · PERF-2 AVIF · PERF-3 image widths · PERF-4 image cache · PERF-5 cached failures · PERF-6 embed facades · RESP-1 device pass · SEO-2 titles · SEO-4 noindex `vercel.app` · OPS-1 security headers · ADMIN-1 expiry · ADMIN-3 view on site · ADMIN-4 health panel |
| **Low** | NAV-8 sticky header · NAV-10 breadcrumbs · NAV-11 search · CONT-9 Newsletter page · CONT-11 Contact routing · CONT-12 Bike Safety · CONT-13 print map pickup · CONT-15 copy polish · FORM-6 form refinements · EVT-5 sign-up labels · EVT-7 past events · VIS-7 card tokens · VIS-10 header polish · VIS-11 About styling · VIS-13 favicon and share images · VIS-14 sense of place · VIS-15 dark mode · A11Y-8 map links · A11Y-9 board alt · A11Y-10 reduced motion · A11Y-11 footer landmarks · A11Y-13 embed titles · A11Y-16 touch targets · A11Y-17 card alt field · PERF-7 loading priority · PERF-8 Turnstile on demand · PERF-9 image hygiene · PERF-10 CI budget · RESP-2 theme color · SEO-3 sitemap dates · OPS-2 error monitoring · ADMIN-2 event entry checks |


---

# Observational notes

Notes from a walkthrough of the site in October 2026. The easy, code-only items were done in PR #12 (`ux-easy-fixes`); the rest need a design pass, new content, or a board decision.

## Done (PR #12)

**Site-wide**
- Menu is a hamburger on the right side rather than a menu button below the logo.
- On mobile the banner "Helping Tahoe become more bicycle friendly" took too much vertical space: smaller type and padding.
- Yellow was too bright for the topmost banner: it is now a photo with a dark blue overlay (white text, contrast checked). A `deepwater` dark blue token was added as the alternative background colour.
- The full LTBC name was in both the logo and the hero text: the hero eyebrow is gone.
- Two primary button colours on the homepage: "Explore the map" is yellow like the rest.
- Newsletter area was very bright with poor contrast: it is a neutral grey panel with the yellow Subscribe button as the accent.
- Added a Donate link to the menu (header button and footer link).
- Footer tagline "helping tahoe..." was styled the same as the address and links: it is now heading-styled, with the address and email smaller and muted.
- Old newsletter URLs re-route correctly (`/get-involved/join` and `/get-involved` both redirect to `/join`); verified, no change needed.

**Bike Kitchen**
- Upcoming events are at the top.
- Buttons cut to three words or fewer.
- The big "Email Us" section in the middle is gone.
- "Join a fix-up" drives people to POINT, not email; the POINT text link is gone.
- The video has a title ("See the Bike Kitchen in action").
- Email links have starter subjects and body text.
- The description of what the Bike Kitchen is covers learning to fix your own bike and the community side, not just donating and fixing.

**Join the Coalition**
- Tier titles are the box titles; the cost is its own line between the title and the CTA, and the CTA is just "Join".
- "One-Time" has a hyphen.
- Each donation section has one CTA instead of both a donation button and "Contribute now".
- "Other ways to get involved" links checked (volunteer list goes to Constant Contact, Subscribe goes to the newsletter box on the page); "Email us" has a subject and starter text.
- Newsletters are no longer listed on this page; the signup box links to the Newsletter page instead.

**Bike Racks**
- Individual CTA to the bike map, which has bike parking locations.
- "Questions?" section removed.

**Bike Valet**
- Small CTA up top for businesses that are already bought in ("Request a valet"), plus a "Volunteer with us" button.
- Volunteer CTA is a button whose text matches where it goes.
- "Questions or want to volunteer?" removed; "Questions?" is a text link inside the business signup section.

**Bike Safety**
- Plugs the Bike Kitchen for bike maintenance.

**Advocacy**
- Newsletter plugged in the Comment Letters section.
- Removed the duplicate Drive link under the embed.

**About**
- One hero image on mobile.
- "all-volunteer" has a hyphen.
- Bigger board pics.
- Board roles are no longer the same blue as text links.

**Programs**
- The "learn more" CTAs are mixed up with specific labels.
- Newsletter signup is embedded in the page rather than a text link buried in comms.

**Newsletter**
- Main header shortened ("Stay Informed"); the "Discover our newsletter archive" eyebrow and the side-by-side section are gone.
- The page is first about joining the newsletter, then a taste of past issues.

**Privacy policy**
- Mentions email sent to us directly.
- No longer mentions the bike rack Google Form while the program is closed.
- The Resend paragraph sits with the site's own forms, not after the Google Forms one.
- Subscribe box and Join page locations are described generically.
- Admin login section removed.

## Still to do

These are open-ended, need new content or a photo, or need a board decision.

**Site-wide**
- "Join the Lake Tahoe Bicycle Coalition" homepage card photo is old; replace it with a newer better one (admin-managed image).
- Broader brand pass: rely mainly on white, grey, and black backgrounds and use the yellow and blues as accents. The `deepwater` token exists; the remaining coloured panels have not been reviewed page by page.
- Larger comment about all of the Program pages: they all need to straddle two audiences, business and individual. Look at how to get the *primary* audience to interact more easily with each page, while still having an accessible alternative route for the secondary audience.
- Consider icons or images to visually separate card blocks (Bike Kitchen cards, "Other ways to get involved", program cards).

**Bike Kitchen**
- Still a lot of text. Intersperse some of the images shunted to the bottom of the page.
- Consider an "add to calendar" link on events.

**Join the Coalition**
- Look at other websites for how to lay out the membership section.
- If there is no actual difference between the tiers, the names (individual vs. business) may be driving away higher donations.
- Reorganize so there are different levels of recurring donations: 20, 40, 100, and "choose your own", merged with the recurring donation section.

**Bike Racks**
- The page is a lot of text. What are people supposed to get from it / why would they visit it?
- It feels weird to have this in a list of pages about how to use LTBC services if there are no services active at the moment.
- Swap out the "email" business CTA and add another collection method to gather interest.

**Bike Valet**
- Rather than a giant form at the bottom, break the page into scannable subsections with headers like "Safe, Convenient Bike Parking", "Attract More People to your event", "Small Investment, Big Returns", with supporting text where visitors need to learn more.

**Bike Safety**
- Tie this into Safe Routes For Schools / other bike safety programming.
- One video can be at the top if needed, but videos aren't scannable.
- Add the information being put together for the bike safety programs around the lake.
- Materials for teachers?

**Advocacy**
- Reverse-sort the letters (not possible with the Drive folder embed; needs a different listing).
- Better visual hierarchy.
- Do we actually want the community to email us with ideas? Consider a form embed instead, which would also gather more complete and relevant info.

**About**
- (nothing outstanding)

**Programs**
- Make this page more about the coalition and the programs we run rather than a menu of the other pages: what it means to run a program, why we run these, how they tie into the mission.
- The index page is a lot of text. Images?

**Volunteer**
- Streamline signup so that signing up for an event also adds you to the volunteer email list. People shouldn't have to sign up twice.

**Privacy policy**
- Is sharing the privacy policy for the website host standard practice? (Naming the host and its policy is common practice for listing subprocessors; left in for now, revisit if it still reads oddly.)
