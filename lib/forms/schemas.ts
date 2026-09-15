import { z } from "zod";

/**
 * Validation for the three public forms. Field lists follow docs/OPEN_QUESTIONS.md
 * Q16 (valet), Q17 (racks), Q18 (contact). Every form also carries a honeypot
 * field named `website` that humans never see and that must stay empty.
 */

function requiredText(label: string, max: number) {
  return z
    .string(`${label} is required.`)
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);
}

function optionalText(label: string, max: number) {
  return z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);
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
  firstName: requiredText("First name", 100),
  lastName: requiredText("Last name", 100),
  email,
  phone: optionalText("Phone number", 40),
  message: requiredText("Message", 5000),
  ...honeypot,
});

export type ContactInput = z.infer<typeof contactSchema>;

export const contactFieldLabels = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email address",
  phone: "Phone number",
  message: "Message",
} as const satisfies Record<Exclude<keyof ContactInput, "website">, string>;

// --- Bike valet request (Q16) ------------------------------------------------

const organizationType = z.enum(
  ["nonprofit", "business-member", "both", "neither"],
  "Tell us whether you are a nonprofit or a Business Member.",
);

export const organizationTypeOptions: { value: z.infer<typeof organizationType>; label: string }[] = [
  { value: "nonprofit", label: "Nonprofit organization" },
  { value: "business-member", label: "Bike Coalition Business Member" },
  { value: "both", label: "Both" },
  { value: "neither", label: "Neither" },
];

export const valetRequestSchema = z.object({
  contactName: requiredText("Contact name", 100),
  organization: requiredText("Organization", 200),
  email,
  phone: requiredText("Phone number", 40),
  eventName: requiredText("Event name", 200),
  eventDate: z.iso.date("Enter the event date."),
  startTime: z.iso.time("Enter the start time."),
  endTime: z.iso.time("Enter the end time."),
  location: requiredText("Event location", 300),
  expectedAttendance: wholeNumber("Expected attendance", 1_000_000),
  expectedBikes: wholeNumber("Expected number of bikes", 100_000),
  organizationType,
  notes: optionalText("Notes", 3000),
  ...honeypot,
});

export type ValetRequestInput = z.infer<typeof valetRequestSchema>;

export const valetRequestFieldLabels = {
  contactName: "Contact name",
  organization: "Organization",
  email: "Email address",
  phone: "Phone number",
  eventName: "Event name",
  eventDate: "Event date",
  startTime: "Start time",
  endTime: "End time",
  location: "Event location",
  expectedAttendance: "Expected attendance",
  expectedBikes: "Expected number of bikes",
  organizationType: "Nonprofit or Business Member",
  notes: "Notes",
} as const satisfies Record<Exclude<keyof ValetRequestInput, "website">, string>;

// --- Bike rack application (Q17) ---------------------------------------------

const rackStyle = z.enum(["bolt-down", "free-standing"], "Choose a rack style.");

export const rackStyleOptions: { value: z.infer<typeof rackStyle>; label: string }[] = [
  { value: "bolt-down", label: "Bolt-down" },
  { value: "free-standing", label: "Free-standing" },
];

const matchingFunds = z.enum(
  ["yes", "partial", "no"],
  "Tell us whether you can provide matching funds.",
);

export const matchingFundsOptions: { value: z.infer<typeof matchingFunds>; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "partial", label: "Partially" },
  { value: "no", label: "No" },
];

export const rackApplicationSchema = z.object({
  businessName: requiredText("Business name", 200),
  contactName: requiredText("Contact name", 100),
  email,
  phone: requiredText("Phone number", 40),
  businessAddress: requiredText("Business address", 300),
  racksRequested: wholeNumber("Number of racks requested", 100),
  rackStyle,
  matchingFunds,
  expectedUse: requiredText("Expected use and community benefit", 3000),
  notes: optionalText("Notes", 3000),
  ...honeypot,
});

export type RackApplicationInput = z.infer<typeof rackApplicationSchema>;

export const rackApplicationFieldLabels = {
  businessName: "Business name",
  contactName: "Contact name",
  email: "Email address",
  phone: "Phone number",
  businessAddress: "Business address",
  racksRequested: "Number of racks requested",
  rackStyle: "Rack style",
  matchingFunds: "Able to provide matching funds",
  expectedUse: "Expected use and community benefit",
  notes: "Notes",
} as const satisfies Record<Exclude<keyof RackApplicationInput, "website">, string>;
