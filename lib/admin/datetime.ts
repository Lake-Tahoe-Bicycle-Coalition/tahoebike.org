import { isoDateInZone, isoTimeInZone, SITE_TIME_ZONE, zonedTimeToUtc } from "@/lib/time";

/**
 * Admin forms take wall-clock dates and times in the site zone (Pacific) as separate
 * `<input type="date">` and `<input type="time">` values; the database stores instants.
 */

export type ZonedParts = { date: string; time: string };

/** A stored instant as the `YYYY-MM-DD` / `HH:MM` pair shown in the form. */
export function toZonedParts(instant: Date): ZonedParts {
  return { date: isoDateInZone(instant, SITE_TIME_ZONE), time: isoTimeInZone(instant, SITE_TIME_ZONE) };
}

/** The instant a form's date/time pair denotes. Both values must already be validated. */
export function fromZonedParts(date: string, time: string): Date {
  return zonedTimeToUtc(date, time, SITE_TIME_ZONE);
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** e.g. "Sep 16, 2026, 4:30 PM" (Pacific), for admin tables. */
export function formatAdminDateTime(instant: Date): string {
  return dateTimeFormatter.format(instant);
}
