/**
 * Seed script: `pnpm db:seed` (runs via prisma.config.ts, from the repo root).
 * Idempotent: every write is an upsert keyed on a stable value, so it can be re-run safely.
 *
 * - Site settings: code defaults from lib/settings.ts; existing rows are left alone.
 * - Admin allowlist: the addresses in SEED_ADMIN_EMAILS (comma-separated). Without it no
 *   admin is seeded and nobody can sign in to /admin until one is added directly in the
 *   database (or via ADMIN_DEV_EMAIL in `next dev`).
 * - Board members, homepage cards and Bike Kitchen events: prisma/seed-data.json, a snapshot
 *   of the public content of the old WordPress site taken during the September 2026 migration.
 *
 * The seed only ever adds. Every upsert has an empty `update`, so rows that already
 * exist (ids prefixed `seed-board-`, `seed-card-`, `seed-event-`, or anything created in
 * /admin) keep whatever the board has edited them to. To reload the snapshot values from
 * scratch, reset the database (`pnpm prisma migrate reset`, which re-runs the seed).
 */
import { readFileSync } from "node:fs";
import { prisma } from "../lib/db";
import { SETTING_DEFAULTS } from "../lib/settings";
// Bike Kitchen event times in the snapshot are Pacific wall-clock times.
import { SITE_TIME_ZONE, zonedTimeToUtc } from "../lib/time";

const SEED_DATA_PATH = "prisma/seed-data.json";

/** Id prefixes for seed-created rows, so a re-run finds them (see the header comment). */
const SEED_BOARD_PREFIX = "seed-board-";
const SEED_CARD_PREFIX = "seed-card-";
const SEED_EVENT_PREFIX = "seed-event-";

/** Shape of prisma/seed-data.json. Image paths are under public/. */
interface SeedData {
  board: { name: string; role: string; bio: string; photoUrl: string }[];
  advisors: string[];
  homepageCards: { title: string; blurb: string; ctaLabel: string; ctaUrl: string; imageUrl: string }[];
  /** `date` is YYYY-MM-DD; times are HH:MM in SITE_TIME_ZONE. */
  bikeKitchenEvents: { date: string; startTime: string; endTime: string; venue: string; address: string }[];
}

function loadSeedData(): SeedData {
  const parsed: unknown = JSON.parse(readFileSync(SEED_DATA_PATH, "utf8"));
  if (typeof parsed !== "object" || parsed === null) throw new Error(`${SEED_DATA_PATH} must be a JSON object`);
  const data = parsed as Partial<SeedData>;
  for (const key of ["board", "advisors", "homepageCards", "bikeKitchenEvents"] as const) {
    if (!Array.isArray(data[key])) throw new Error(`${SEED_DATA_PATH}: "${key}" must be an array`);
  }
  return data as SeedData;
}

/** `Victoria "V" Ortiz` → `victoria-v-ortiz` */
function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
  const emails = (process.env.SEED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
  if (emails.length === 0) {
    console.log("admins: SEED_ADMIN_EMAILS is not set; no admin seeded");
    return;
  }
  for (const email of emails) {
    if (!email.includes("@")) throw new Error(`SEED_ADMIN_EMAILS: "${email}" is not an email address`);
    await prisma.adminUser.upsert({
      where: { email },
      create: { email, name: email },
      // Add-only (see the header): a name edited at /admin/users survives a re-seed.
      update: {},
    });
  }
  console.log(`admins: ${emails.length} allowlisted`);
}

async function seedBoard(data: SeedData) {
  let sortOrder = 0;
  for (const member of data.board) {
    const fields = { ...member, sortOrder: sortOrder++, isAdvisor: false, isActive: true };
    const id = `${SEED_BOARD_PREFIX}${slugify(member.name)}`;
    await prisma.boardMember.upsert({ where: { id }, create: { id, ...fields }, update: {} });
  }
  for (const name of data.advisors) {
    const fields = { name, role: "Advisor", bio: "", photoUrl: null, sortOrder: sortOrder++, isAdvisor: true, isActive: true };
    const id = `${SEED_BOARD_PREFIX}${slugify(name)}`;
    await prisma.boardMember.upsert({ where: { id }, create: { id, ...fields }, update: {} });
  }
  console.log(`board: ${data.board.length} members + ${data.advisors.length} advisors ensured`);
}

async function seedHomepageCards(data: SeedData) {
  let sortOrder = 0;
  for (const card of data.homepageCards) {
    const fields = { ...card, sortOrder: sortOrder++, isActive: true };
    const id = `${SEED_CARD_PREFIX}${slugify(card.title)}`;
    await prisma.homepageCard.upsert({ where: { id }, create: { id, ...fields }, update: {} });
  }
  console.log(`homepage cards: ${data.homepageCards.length} ensured`);
}

async function seedBikeKitchenEvents(data: SeedData) {
  // Past events are seeded too; the site filters by date.
  for (const event of data.bikeKitchenEvents) {
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
    const id = `${SEED_EVENT_PREFIX}${event.date}-${slugify(event.venue)}`;
    await prisma.event.upsert({ where: { id }, create: { id, ...fields }, update: {} });
  }
  console.log(`events: ${data.bikeKitchenEvents.length} Bike Kitchen events ensured`);
}

async function main() {
  await seedSettings();
  await seedAdmins();

  const data = loadSeedData();
  await seedBoard(data);
  await seedHomepageCards(data);
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
