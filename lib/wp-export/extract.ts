/**
 * Extract the structured content the database is seeded from:
 * board members (/about), homepage slides (/), Bike Kitchen events
 * (/programs/bike-kitchen). Each extractor throws with a clear message when
 * the shortcodes it expects are missing, so a change in the export is noticed.
 */
import { htmlToText } from "./html";
import { findShortcodes, requireShortcodes } from "./shortcodes";

export interface TeamMember {
  name: string;
  /** Divi `position`; null for the name-only advisor cards. */
  position: string | null;
  /** Divi `image_url` exactly as written in the export; null when absent. */
  imageUrl: string | null;
  /** Raw bio HTML between the tags (may be empty). */
  bioHtml: string;
  /** Bio as plain-text paragraphs (see `htmlToText`). */
  bio: string;
}

/** `[et_pb_team_member name=".." position=".." image_url=".."]<p>bio</p>[/et_pb_team_member]` */
export function extractTeamMembers(body: string): TeamMember[] {
  return requireShortcodes(body, "et_pb_team_member", "the About page body").map((sc, index) => {
    const name = sc.attrs["name"] ?? "";
    if (name === "") {
      throw new Error(`[et_pb_team_member] #${index + 1} has no name attribute.`);
    }
    const position = sc.attrs["position"];
    const imageUrl = sc.attrs["image_url"];
    return {
      name,
      position: position === undefined || position === "" ? null : position,
      imageUrl: imageUrl === undefined || imageUrl === "" ? null : imageUrl,
      bioHtml: sc.inner,
      bio: htmlToText(sc.inner),
    };
  });
}

export interface Slide {
  heading: string;
  buttonText: string;
  buttonLink: string;
  /** Divi `background_image` exactly as written; null when absent. */
  backgroundImage: string | null;
  /** Slide body as plain text. */
  text: string;
}

/** `[et_pb_slide heading=".." button_text=".." button_link=".." background_image=".."]<p>text</p>[/et_pb_slide]` */
export function extractSlides(body: string): Slide[] {
  return requireShortcodes(body, "et_pb_slide", "the home page body").map((sc, index) => {
    const heading = sc.attrs["heading"] ?? "";
    if (heading === "") {
      throw new Error(`[et_pb_slide] #${index + 1} has no heading attribute.`);
    }
    const backgroundImage = sc.attrs["background_image"];
    return {
      heading,
      buttonText: sc.attrs["button_text"] ?? "",
      buttonLink: sc.attrs["button_link"] ?? "",
      backgroundImage: backgroundImage === undefined || backgroundImage === "" ? null : backgroundImage,
      text: htmlToText(sc.inner),
    };
  });
}

export interface BikeKitchenEvent {
  /** `YYYY-MM-DD` (wall-clock date, no zone). */
  date: string;
  /** `HH:MM`, 24-hour wall-clock time. */
  startTime: string;
  /** `HH:MM`, 24-hour wall-clock time. */
  endTime: string;
  venue: string;
  address: string;
}

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** `August 26, 2026` → `2026-08-26` */
export function parseLongDate(text: string): string {
  const match = /^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(text.trim());
  const month = match?.[1] === undefined ? undefined : MONTHS[match[1].toLowerCase()];
  if (!match || month === undefined) {
    throw new Error(`Unrecognised date "${text}" (expected e.g. "August 26, 2026").`);
  }
  const day = Number(match[2]);
  if (day < 1 || day > 31) throw new Error(`Day out of range in date "${text}".`);
  return `${match[3]}-${pad2(month)}-${pad2(day)}`;
}

interface ClockTime {
  hour: number;
  minute: number;
  meridiem: "am" | "pm" | null;
}

function parseClock(text: string): ClockTime | null {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/i.exec(text.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (hour < 1 || hour > 12 || minute > 59) return null;
  const rawMeridiem = match[3]?.toLowerCase().replace(/\./g, "");
  return { hour, minute, meridiem: rawMeridiem === "am" || rawMeridiem === "pm" ? rawMeridiem : null };
}

function to24h(time: ClockTime, meridiem: "am" | "pm"): string {
  const hour = meridiem === "pm" ? (time.hour % 12) + 12 : time.hour % 12;
  return `${pad2(hour)}:${pad2(time.minute)}`;
}

/**
 * `2-4pm` → 14:00–16:00, `4:30-7pm` → 16:30–19:00, `11am-1pm` → 11:00–13:00,
 * `11-1pm` → 11:00–13:00 (a start with no meridiem inherits the end's, unless
 * that would put it after the end, in which case it flips).
 */
export function parseTimeRange(text: string): { startTime: string; endTime: string } {
  const [startText, endText, extra] = text.split(/\s*[-–—]\s*/);
  const start = startText === undefined ? null : parseClock(startText);
  const end = endText === undefined ? null : parseClock(endText);
  if (!start || !end || extra !== undefined || end.meridiem === null) {
    throw new Error(`Unrecognised time range "${text}" (expected e.g. "2-4pm" or "4:30-7pm").`);
  }
  const endMeridiem = end.meridiem;
  let startMeridiem = start.meridiem ?? endMeridiem;
  if (start.meridiem === null) {
    const startMinutes = (start.hour % 12) * 60 + start.minute;
    const endMinutes = (end.hour % 12) * 60 + end.minute;
    if (startMinutes > endMinutes) startMeridiem = endMeridiem === "pm" ? "am" : "pm";
  }
  return { startTime: to24h(start, startMeridiem), endTime: to24h(end, endMeridiem) };
}

/**
 * Events from the "Upcoming Bike Kitchen Events" accordion on /programs/bike-kitchen.
 * Each entry is a paragraph like
 * `<p><strong>August 26, 2026 | 2-4pm: Sierra Community House<br /></strong>265 Bear St, Kings Beach, CA</p>`.
 * Empty paragraphs are skipped; any other paragraph that does not match throws.
 */
export function extractBikeKitchenEvents(body: string): BikeKitchenEvent[] {
  const accordionItems = requireShortcodes(body, "et_pb_accordion_item", "the Bike Kitchen page body");
  const item =
    accordionItems.find((sc) => /bike kitchen events/i.test(sc.attrs["title"] ?? "")) ??
    (accordionItems.length === 1 ? accordionItems[0] : undefined);
  if (!item) {
    throw new Error(
      `Could not find the "Upcoming Bike Kitchen Events" accordion item; found titles: ${accordionItems
        .map((sc) => JSON.stringify(sc.attrs["title"] ?? ""))
        .join(", ")}`,
    );
  }

  // "<date> | <time range>: <venue>". The time range is matched explicitly so a
  // "4:30" start time is not mistaken for the colon before the venue.
  const clock = String.raw`\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?`;
  const headlineRe = new RegExp(String.raw`^(.+?)\s*\|\s*(${clock}\s*[-–—]\s*${clock})\s*:\s*(.+)$`, "i");

  const events: BikeKitchenEvent[] = [];
  const paragraphs = htmlToText(item.inner).split("\n\n");
  for (const paragraph of paragraphs) {
    const [headline, address, ...rest] = paragraph.split("\n");
    const match = headline === undefined ? null : headlineRe.exec(headline);
    if (!match || address === undefined || rest.length > 0) {
      throw new Error(
        `Unrecognised Bike Kitchen event entry (expected "<date> | <time range>: <venue>" then an address line):\n${paragraph}`,
      );
    }
    const [, dateText, timeText, venue] = match;
    if (dateText === undefined || timeText === undefined || venue === undefined) {
      throw new Error(`Unrecognised Bike Kitchen event headline: ${headline}`);
    }
    events.push({
      date: parseLongDate(dateText),
      ...parseTimeRange(timeText),
      venue: venue.trim(),
      address: address.trim(),
    });
  }
  if (events.length === 0) {
    throw new Error("The Bike Kitchen events accordion contains no event entries.");
  }
  return events;
}

/** Whether a body contains a given shortcode at all (for callers that want a soft check). */
export function hasShortcode(body: string, tag: string): boolean {
  return findShortcodes(body, tag).length > 0;
}
