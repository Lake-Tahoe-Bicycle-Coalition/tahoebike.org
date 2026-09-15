/**
 * Convert a wall-clock date/time in a named IANA time zone to a UTC `Date`,
 * using only `Intl.DateTimeFormat` (no dependencies).
 *
 * Example: `zonedTimeToUtc("2026-08-26", "14:00", "America/Los_Angeles")`
 * is 2026-08-26T21:00:00.000Z (PDT is UTC-7).
 */

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** The zone's UTC offset in milliseconds at a given instant (positive east of UTC). */
export function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = formatterFor(timeZone).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    if (!part) throw new Error(`Intl.DateTimeFormat returned no "${type}" part for zone ${timeZone}`);
    return Number.parseInt(part.value, 10);
  };
  // `hourCycle: "h23"` should give 00–23, but some engines have returned "24".
  const hour = get("hour") % 24;
  const wallClockAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return wallClockAsUtc - instant.getTime();
}

/**
 * @param date `YYYY-MM-DD`
 * @param time `HH:MM` (24-hour) or `HH:MM:SS`
 * @param timeZone IANA zone name, e.g. `America/Los_Angeles`
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!dateMatch || !timeMatch) {
    throw new Error(`zonedTimeToUtc: expected YYYY-MM-DD and HH:MM, got "${date}" "${time}"`);
  }
  const [, y, mo, d] = dateMatch;
  const [, h, mi, s] = timeMatch;
  const wallClockAsUtc = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s ?? "0"),
  );

  // First guess: apply the offset in force at the wall-clock instant read as UTC.
  // Then re-derive the offset at the guessed instant; they differ only within a
  // few hours of a DST transition, in which case the second offset is the right one.
  const firstOffset = zoneOffsetMs(new Date(wallClockAsUtc), timeZone);
  let utc = wallClockAsUtc - firstOffset;
  const secondOffset = zoneOffsetMs(new Date(utc), timeZone);
  if (secondOffset !== firstOffset) utc = wallClockAsUtc - secondOffset;
  return new Date(utc);
}
