/**
 * Seed script: `pnpm db:seed` (runs via prisma.config.ts).
 * Idempotent: every write is an upsert keyed on a stable value, so it can be re-run safely.
 *
 * Phase 1 seeds site settings and the admin allowlist.
 * Phase 2 extends this with board members, homepage cards, and Bike Kitchen events
 * parsed from the WordPress export (content/generated/*.json).
 */
import { prisma } from "../lib/db";
import { SETTING_DEFAULTS } from "../lib/settings";

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

async function main() {
  await seedSettings();
  await seedAdmins();
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
