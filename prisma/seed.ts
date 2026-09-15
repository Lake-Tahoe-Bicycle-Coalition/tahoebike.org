/**
 * Seed script: `pnpm db:seed` (runs via prisma.config.ts, from the repo root).
 * Idempotent: every write is an upsert keyed on a stable value, so it can be re-run safely.
 *
 * - Site settings: code defaults from lib/settings.ts; existing rows are left alone.
 * - Admin allowlist: placeholders (see TODO below).
 * - Board members, homepage cards and Bike Kitchen events: parsed straight from the
 *   WordPress export (reference/…xml) with lib/wp-export, using content/image-map.json
 *   (written by `pnpm content:images`) to turn wp-content/uploads URLs into /images paths.
 *
 * Until the Phase 3 admin exists, the export is the source of truth for that content:
 * the upserts write every field in `update` too, so re-running the seed restores the
 * export values over any manual edits. Once board members edit rows in /admin, switch
 * those `update` blocks to `{}` (as settings already do) so their edits survive.
 */
import { readFileSync } from "node:fs";
import { prisma } from "../lib/db";
import { SETTING_DEFAULTS } from "../lib/settings";
// Bike Kitchen event times in the export are Pacific wall-clock times.
import { SITE_TIME_ZONE, zonedTimeToUtc } from "../lib/time";
import {
  WP_EXPORT_PATH,
  extractBikeKitchenEvents,
  extractSlides,
  extractTeamMembers,
  parseWpExport,
  requirePage,
  type WpExport,
} from "../lib/wp-export";

const IMAGE_MAP_PATH = "content/image-map.json";

// TODO(allowlist): replace these placeholders with the real board member Google account
// emails before the first production deploy. See docs/OPEN_QUESTIONS.md Q24.
const ADMIN_ALLOWLIST: { email: string; name: string }[] = [
  { email: "president@example.com", name: "Placeholder President" },
  { email: "webmaster@example.com", name: "Placeholder Webmaster" },
];

async function seedSettings() {
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      // Existing values are left alone so admin edits survive re-seeding.
      update: {},
    });
  }
  console.log(`settings: ${Object.keys(SETTING_DEFAULTS).length} keys ensured`);
}

async function seedAdmins() {
  for (const admin of ADMIN_ALLOWLIST) {
    const email = admin.email.toLowerCase();
    await prisma.adminUser.upsert({
      where: { email },
      create: { email, name: admin.name },
      update: { name: admin.name },
    });
  }
  console.log(`admins: ${ADMIN_ALLOWLIST.length} allowlisted (placeholders; see TODO)`);
}

// ---------------------------------------------------------------------------
// Content from the WordPress export
// ---------------------------------------------------------------------------

/** `Victoria "V" Ortiz` → `victoria-v-ortiz` */
function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadImageMap(): Record<string, string> {
  let raw: string;
  try {
    raw = readFileSync(IMAGE_MAP_PATH, "utf8");
  } catch (error) {
    throw new Error(`Could not read ${IMAGE_MAP_PATH} (run \`pnpm content:images\` first): ${String(error)}`);
  }
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${IMAGE_MAP_PATH} must be a JSON object of source URL -> local path`);
  }
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string") throw new Error(`${IMAGE_MAP_PATH}: value for ${key} is not a string`);
    map[key] = value;
  }
  return map;
}

/** Resolve an export image URL to its local /images path; throws if it is not in the map. */
function localImage(imageMap: Record<string, string>, sourceUrl: string, context: string): string {
  const local = imageMap[sourceUrl];
  if (local === undefined) {
    throw new Error(
      `${context}: image ${sourceUrl} is not in ${IMAGE_MAP_PATH}. Run \`pnpm content:images\` and commit the result.`,
    );
  }
  return local;
}

/**
 * Links into the WordPress site become site-relative paths without a trailing
 * slash (`https://tahoebike.org/join/` → `/join`); everything else is unchanged
 * (map.tahoebike.org, tahoebikemonth.org, mailto:, …).
 */
export function toSiteRelativeUrl(url: string): string {
  const match = /^https?:\/\/(?:www\.)?tahoebike\.org(\/[^?#]*)?([?#].*)?$/i.exec(url.trim());
  if (!match) return url.trim();
  const path = (match[1] ?? "/").replace(/\/+$/, "") || "/";
  return `${path}${match[2] ?? ""}`;
}

async function seedBoard(data: WpExport, imageMap: Record<string, string>) {
  const members = extractTeamMembers(requirePage(data, "/about").body);
  const board = members.filter((m) => m.position !== null);
  const advisors = members.filter((m) => m.position === null);
  if (board.length === 0) throw new Error("No board members (team cards with a position) found on /about.");
  if (advisors.length === 0) throw new Error("No advisors (name-only team cards) found on /about.");

  let sortOrder = 0;
  for (const member of board) {
    if (member.imageUrl === null) {
      throw new Error(`Board member ${member.name} has no image_url on /about.`);
    }
    const fields = {
      name: member.name,
      role: member.position ?? "",
      bio: member.bio,
      photoUrl: localImage(imageMap, member.imageUrl, `Board member ${member.name}`),
      sortOrder: sortOrder++,
      isAdvisor: false,
      isActive: true,
    };
    const id = `seed-board-${slugify(member.name)}`;
    await prisma.boardMember.upsert({ where: { id }, create: { id, ...fields }, update: fields });
  }
  for (const advisor of advisors) {
    const fields = {
      name: advisor.name,
      role: "Advisor",
      bio: "",
      photoUrl: null,
      sortOrder: sortOrder++,
      isAdvisor: true,
      isActive: true,
    };
    const id = `seed-board-${slugify(advisor.name)}`;
    await prisma.boardMember.upsert({ where: { id }, create: { id, ...fields }, update: fields });
  }
  console.log(`board: ${board.length} members + ${advisors.length} advisors upserted from /about`);
}

async function seedHomepageCards(data: WpExport, imageMap: Record<string, string>) {
  const slides = extractSlides(requirePage(data, "/").body);
  let sortOrder = 0;
  for (const slide of slides) {
    if (slide.backgroundImage === null) {
      throw new Error(`Home page slide "${slide.heading}" has no background_image.`);
    }
    const fields = {
      title: slide.heading,
      blurb: slide.text,
      ctaLabel: slide.buttonText,
      ctaUrl: toSiteRelativeUrl(slide.buttonLink),
      imageUrl: localImage(imageMap, slide.backgroundImage, `Home page slide "${slide.heading}"`),
      sortOrder: sortOrder++,
      isActive: true,
    };
    const id = `seed-card-${slugify(slide.heading)}`;
    await prisma.homepageCard.upsert({ where: { id }, create: { id, ...fields }, update: fields });
  }
  console.log(`homepage cards: ${slides.length} upserted from the home page slider`);
}

async function seedBikeKitchenEvents(data: WpExport) {
  // All events in the accordion are seeded, past ones included; the site filters by date.
  const events = extractBikeKitchenEvents(requirePage(data, "/programs/bike-kitchen").body);
  for (const event of events) {
    const fields = {
      title: event.venue,
      program: "BIKE_KITCHEN" as const,
      startsAt: zonedTimeToUtc(event.date, event.startTime, SITE_TIME_ZONE),
      endsAt: zonedTimeToUtc(event.date, event.endTime, SITE_TIME_ZONE),
      locationName: event.venue,
      address: event.address,
      description: "",
      registrationUrl: SETTING_DEFAULTS.point_org_url,
    };
    const id = `seed-event-${event.date}-${slugify(event.venue)}`;
    await prisma.event.upsert({ where: { id }, create: { id, ...fields }, update: fields });
  }
  console.log(`events: ${events.length} Bike Kitchen events upserted from /programs/bike-kitchen`);
}

async function main() {
  await seedSettings();
  await seedAdmins();

  const data = parseWpExport(WP_EXPORT_PATH);
  const imageMap = loadImageMap();
  await seedBoard(data, imageMap);
  await seedHomepageCards(data, imageMap);
  await seedBikeKitchenEvents(data);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
