import { SmartLink } from "@/components/smart-link";
import { getActiveAnnouncement } from "@/lib/content";

/**
 * Site-wide banner shown while an Announcement row is active (startsAt <= now <= endsAt).
 * Renders nothing when there is no active announcement.
 */
export async function AnnouncementBanner() {
  const announcement = await getActiveAnnouncement();
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
            <SmartLink href={linkUrl} className={linkClass}>
              Learn more
            </SmartLink>
          </>
        ) : null}
      </p>
    </aside>
  );
}
