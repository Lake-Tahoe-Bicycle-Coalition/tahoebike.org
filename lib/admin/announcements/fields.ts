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

export type AnnouncementStatus = "live" | "scheduled" | "expired";

/** Where an announcement sits relative to `now`; the list page shows it as a badge. */
export function announcementStatus(row: { startsAt: Date; endsAt: Date }, now: Date): AnnouncementStatus {
  if (row.endsAt < now) return "expired";
  if (row.startsAt > now) return "scheduled";
  return "live";
}

export const announcementStatusLabels: Record<AnnouncementStatus, string> = {
  live: "Live",
  scheduled: "Scheduled",
  expired: "Expired",
};
