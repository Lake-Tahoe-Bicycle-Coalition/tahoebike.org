import { z } from "zod";
import { fromZonedParts, toZonedParts } from "@/lib/admin/datetime";
import { emptyToNull, optionalLink, requiredLine } from "@/lib/forms/validators";
import type { Announcement } from "@/lib/generated/prisma/client";
import type { AnnouncementFormValues } from "./fields";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME = /^\d{2}:\d{2}$/;

/** Both halves present and well-formed (each half reports its own error otherwise). */
function isCompleteInstant(date: string, time: string): boolean {
  return ISO_DATE.test(date) && ISO_TIME.test(time);
}

/**
 * Validates the announcement form and produces the columns to write. Server-only.
 * The banner renders the message as one paragraph, so line breaks are rejected
 * (requiredLine) rather than silently flattened. The cross-field rule is a refine so
 * that it reports alongside the field errors, as in lib/admin/events/schema.ts.
 */
export const announcementSchema = z
  .object({
    message: requiredLine("Message", 300),
    linkUrl: optionalLink("Link"),
    startDate: z.iso.date("Enter the start date."),
    startTime: z.iso.time({ precision: -1, error: "Enter the start time." }),
    endDate: z.iso.date("Enter the end date."),
    endTime: z.iso.time({ precision: -1, error: "Enter the end time." }),
  })
  .refine(
    (data) =>
      !isCompleteInstant(data.startDate, data.startTime) ||
      !isCompleteInstant(data.endDate, data.endTime) ||
      fromZonedParts(data.endDate, data.endTime) > fromZonedParts(data.startDate, data.startTime),
    { error: "The end must be after the start.", path: ["endTime"] },
  )
  .transform((data) => {
    return {
      message: data.message,
      linkUrl: emptyToNull(data.linkUrl),
      startsAt: fromZonedParts(data.startDate, data.startTime),
      endsAt: fromZonedParts(data.endDate, data.endTime),
    };
  });

export type AnnouncementData = z.output<typeof announcementSchema>;

/** A stored announcement as form values (for the edit page). */
export function announcementToFormValues(announcement: Announcement): AnnouncementFormValues {
  const start = toZonedParts(announcement.startsAt);
  const end = toZonedParts(announcement.endsAt);
  return {
    message: announcement.message,
    linkUrl: announcement.linkUrl ?? "",
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
  };
}
