import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Announcement } from "@/lib/generated/prisma/client";

/**
 * Site-wide banner shown while an Announcement row is active (startsAt <= now <= endsAt).
 * Renders nothing when there is no active announcement or the database is unreachable.
 */
export async function AnnouncementBanner() {
  const now = new Date();
  let announcement: Announcement | null = null;
  try {
    announcement = await prisma.announcement.findFirst({
      where: { startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { startsAt: "desc" },
    });
  } catch (error) {
    console.error("Could not load announcements.", error);
  }
  if (!announcement) return null;

  const linkClass = "font-bold text-asphalt decoration-asphalt/50 hover:decoration-asphalt";
  const { linkUrl } = announcement;

  return (
    <aside role="note" aria-label="Announcement" className="bg-safety text-asphalt">
      <p className="mx-auto w-full max-w-6xl px-4 py-3 text-center">
        {announcement.message}
        {linkUrl ? (
          <>
            {" "}
            {/^https?:/i.test(linkUrl) ? (
              <a href={linkUrl} className={linkClass} target="_blank" rel="noopener">
                Learn more
              </a>
            ) : (
              <Link href={linkUrl} className={linkClass}>
                Learn more
              </Link>
            )}
          </>
        ) : null}
      </p>
    </aside>
  );
}
