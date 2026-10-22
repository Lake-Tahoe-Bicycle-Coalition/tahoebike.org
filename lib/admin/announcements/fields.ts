/**
 * Field list for the announcement form, shared by the client component
 * (components/admin/announcement-form.tsx) and the server schema (./schema.ts). Zod-free.
 */

export const announcementFieldNames = ["message", "linkUrl", "startDate", "startTime", "endDate", "endTime"] as const;

export type AnnouncementFieldName = (typeof announcementFieldNames)[number];

/** The form's string values (what the inputs hold), as opposed to the database row. */
export type AnnouncementFormValues = Record<AnnouncementFieldName, string>;

export const emptyAnnouncementFormValues: AnnouncementFormValues = {
  message: "",
  linkUrl: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
};

/** `hidden`: live by its dates, but a newer live announcement is the one the site shows. */
export type AnnouncementStatus = "live" | "hidden" | "scheduled" | "expired";

type Timed = { id: string; startsAt: Date; endsAt: Date };

/** Where one announcement sits relative to `now`, ignoring the others. */
function timeStatus(row: Timed, now: Date): "live" | "scheduled" | "expired" {
  if (row.endsAt < now) return "expired";
  if (row.startsAt > now) return "scheduled";
  return "live";
}

/**
 * Each announcement's status for the list page's badges. The site shows only one banner:
 * the live announcement that started most recently (components/announcement-banner.tsx via
 * getActiveAnnouncement), so any other live one is `hidden` rather than `live`.
 */
export function announcementStatuses(rows: Timed[], now: Date): Map<string, AnnouncementStatus> {
  let shown: Timed | null = null;
  for (const row of rows) {
    if (timeStatus(row, now) === "live" && (!shown || row.startsAt > shown.startsAt)) shown = row;
  }
  return new Map(
    rows.map((row) => {
      const status = timeStatus(row, now);
      return [row.id, status === "live" && row !== shown ? "hidden" : status];
    }),
  );
}

export const announcementStatusLabels: Record<AnnouncementStatus, string> = {
  live: "Live",
  hidden: "Hidden",
  scheduled: "Scheduled",
  expired: "Expired",
};
