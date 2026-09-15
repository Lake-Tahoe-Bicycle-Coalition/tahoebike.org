import { prisma } from "@/lib/db";
import type { Event, Program } from "@/lib/generated/prisma/client";

export type { Event };

/** Events that have not ended yet, soonest first. Optionally limited to one program. */
export async function getUpcomingEvents(program?: Program): Promise<Event[]> {
  try {
    return await prisma.event.findMany({
      where: { endsAt: { gte: new Date() }, ...(program ? { program } : {}) },
      orderBy: { startsAt: "asc" },
    });
  } catch (error) {
    console.error("Could not load events.", error);
    return [];
  }
}

/** Event times are entered and displayed in Pacific time, whatever the server's zone. */
const TIME_ZONE = "America/Los_Angeles";

const longDate = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
});

const time = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** e.g. "Wednesday, September 16, 2026" */
export function formatEventDate(startsAt: Date): string {
  return longDate.format(startsAt);
}

/** Splits "4:30 PM" into { clock: "4:30", period: "pm" } without relying on the separator character. */
function clockParts(date: Date): { clock: string; period: string } {
  let clock = "";
  let period = "";
  for (const part of time.formatToParts(date)) {
    if (part.type === "dayPeriod") period = part.value.toLowerCase();
    else if (part.type !== "literal" || part.value.trim() === ":") clock += part.value;
  }
  return { clock: clock.trim(), period };
}

/**
 * e.g. "4:30–7:00 pm" or "11:30 am–1:00 pm". When the event crosses midnight or spans
 * several days both dates are shown: "Sep 16, 4:30 pm – Sep 17, 9:00 am".
 */
export function formatEventTimeRange(startsAt: Date, endsAt: Date): string {
  const start = clockParts(startsAt);
  const end = clockParts(endsAt);
  if (dayKey.format(startsAt) !== dayKey.format(endsAt)) {
    return `${shortDate.format(startsAt)}, ${start.clock} ${start.period} – ${shortDate.format(endsAt)}, ${end.clock} ${end.period}`;
  }
  if (start.period === end.period) {
    return `${start.clock}–${end.clock} ${end.period}`;
  }
  return `${start.clock} ${start.period}–${end.clock} ${end.period}`;
}
