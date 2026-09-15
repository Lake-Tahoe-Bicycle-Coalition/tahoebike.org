import { z } from "zod";
import { isoDateInZone } from "@/lib/time";
import { matchingFundsValues, organizationTypeValues, rackStyleValues } from "./fields";

/**
 * Validation for the three public forms. Field lists follow docs/OPEN_QUESTIONS.md
 * Q16 (valet), Q17 (racks), Q18 (contact). Every form also carries a honeypot
 * field named `website` that humans never see and that must stay empty.
 *
 * Server-only: the client components import labels and option lists from ./fields
 * (which is zod-free) so that zod stays out of the browser bundle.
 */

/** Multi-line text (textarea). */
function requiredText(label: string, max: number) {
  return z
    .string(`${label} is required.`)
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);
}

/** Multi-line text (textarea), may be empty. */
function optionalText(label: string, max: number) {
  return z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);
}

/**
 * Single-line values must not contain line breaks: several of them end up in email
 * subjects, where an injected CR/LF could add headers.
 */
const NO_LINE_BREAKS = /^[^\r\n]*$/;

function requiredLine(label: string, max: number) {
  return requiredText(label, max).regex(NO_LINE_BREAKS, { error: `${label} must be a single line.` });
}

function optionalLine(label: string, max: number) {
  return optionalText(label, max).regex(NO_LINE_BREAKS, { error: `${label} must be a single line.` });
}

const email = z
  .string("Email address is required.")
  .trim()
  .min(1, "Email address is required.")
  .max(254, "Email address must be 254 characters or fewer.")
  .pipe(z.email("Enter a valid email address."));

function wholeNumber(label: string, max: number) {
  return z
    .string(`${label} is required.`)
    .trim()
    .min(1, `${label} is required.`)
    .regex(/^\d+$/, `${label} must be a whole number.`)
    .transform(Number)
    .pipe(z.number().int().min(1, `${label} must be at least 1.`).max(max, `${label} must be ${max} or less.`));
}

/** Bots fill in every field; people never see this one. */
const honeypot = { website: z.string().max(0, "Invalid submission.") };

// --- Contact (Q18) -----------------------------------------------------------

export const contactSchema = z.object({
  firstName: requiredLine("First name", 100),
  lastName: requiredLine("Last name", 100),
  email,
  phone: optionalLine("Phone number", 40),
  message: requiredText("Message", 5000),
  ...honeypot,
});

export type ContactInput = z.infer<typeof contactSchema>;

// --- Bike valet request (Q16) ------------------------------------------------

const organizationType = z.enum(
  organizationTypeValues,
  "Tell us whether you are a nonprofit or a Business Member.",
);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;

/** Seconds since midnight for `HH:MM`, `HH:MM:SS`, or `HH:MM:SS.sss`; null if malformed. */
function timeToSeconds(time: string): number | null {
  const match = ISO_TIME.exec(time);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0);
}

export const valetRequestSchema = z
  .object({
    contactName: requiredLine("Contact name", 100),
    organization: requiredLine("Organization", 200),
    email,
    phone: requiredLine("Phone number", 40),
    eventName: requiredLine("Event name", 200),
    eventDate: z.iso.date("Enter the event date."),
    startTime: z.iso.time("Enter the start time."),
    endTime: z.iso.time("Enter the end time."),
    location: requiredLine("Event location", 300),
    expectedAttendance: wholeNumber("Expected attendance", 1_000_000),
    expectedBikes: wholeNumber("Expected number of bikes", 100_000),
    organizationType,
    notes: optionalText("Notes", 3000),
    ...honeypot,
  })
  // Cross-field rules. Each attaches its issue to one field so the form shows it
  // inline; each skips values that already failed their own checks above.
  .refine((data) => !ISO_DATE.test(data.eventDate) || data.eventDate >= isoDateInZone(), {
    error: "The event date must be today or later.",
    path: ["eventDate"],
  })
  .refine(
    (data) => {
      const start = timeToSeconds(data.startTime);
      const end = timeToSeconds(data.endTime);
      return start === null || end === null || end > start;
    },
    { error: "The end time must be after the start time.", path: ["endTime"] },
  );

export type ValetRequestInput = z.infer<typeof valetRequestSchema>;

// --- Bike rack application (Q17) ---------------------------------------------

const rackStyle = z.enum(rackStyleValues, "Choose a rack style.");

const matchingFunds = z.enum(matchingFundsValues, "Tell us whether you can provide matching funds.");

export const rackApplicationSchema = z.object({
  businessName: requiredLine("Business name", 200),
  contactName: requiredLine("Contact name", 100),
  email,
  phone: requiredLine("Phone number", 40),
  businessAddress: requiredLine("Business address", 300),
  racksRequested: wholeNumber("Number of racks requested", 100),
  rackStyle,
  matchingFunds,
  expectedUse: requiredText("Expected use and community benefit", 3000),
  notes: optionalText("Notes", 3000),
  ...honeypot,
});

export type RackApplicationInput = z.infer<typeof rackApplicationSchema>;
