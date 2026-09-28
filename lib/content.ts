import { prisma } from "@/lib/db";
import type {
  Announcement,
  BoardMember,
  Event,
  HomepageCard,
  Program,
} from "@/lib/generated/prisma/client";

/**
 * Every database read behind the public pages lives here (site settings are read in
 * lib/settings.ts through the same `readOrFallback`).
 *
 * Failure policy (docs/OPEN_QUESTIONS.md Q42): a failed read THROWS in production and
 * during `next build`. Public pages are statically regenerated every few minutes, and a
 * regeneration that throws leaves the last good page in the cache, whereas one that
 * returned code defaults would cache a page with default prices, no board and no events.
 * A build that cannot reach the database fails instead of deploying default content.
 * Only `next dev` falls back, so the site stays browsable while the local database is down.
 */
export async function readOrFallback<T>(label: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (process.env.NODE_ENV !== "development") throw error;
    console.error(`[content] Could not load ${label}; using the fallback (development only).`, error);
    return fallback;
  }
}

/** The site-wide banner: the most recently started announcement that is live now. */
export function getActiveAnnouncement(): Promise<Announcement | null> {
  const now = new Date();
  return readOrFallback(
    "announcements",
    () =>
      prisma.announcement.findFirst({
        where: { startsAt: { lte: now }, endsAt: { gte: now } },
        orderBy: { startsAt: "desc" },
      }),
    null,
  );
}

/** Active homepage cards in display order. */
export function getHomepageCards(): Promise<HomepageCard[]> {
  return readOrFallback(
    "homepage cards",
    () =>
      prisma.homepageCard.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    [],
  );
}

/** Active board members and advisors in display order. */
export async function getBoard(): Promise<{ board: BoardMember[]; advisors: BoardMember[] }> {
  const members = await readOrFallback(
    "board members",
    () =>
      prisma.boardMember.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    [],
  );
  return {
    board: members.filter((member) => !member.isAdvisor),
    advisors: members.filter((member) => member.isAdvisor),
  };
}

/** Events that have not ended yet, soonest first. Optionally limited to one program. */
export function getUpcomingEvents(program?: Program): Promise<Event[]> {
  return readOrFallback(
    "events",
    () =>
      prisma.event.findMany({
        where: { endsAt: { gte: new Date() }, ...(program ? { program } : {}) },
        orderBy: { startsAt: "asc" },
      }),
    [],
  );
}
