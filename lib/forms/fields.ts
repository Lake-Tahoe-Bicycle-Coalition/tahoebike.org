/**
 * Field labels and option lists for the three public forms, shared by the client
 * components (components/forms/*.tsx) and the server-side schemas (./schemas.ts).
 *
 * Deliberately free of zod (and every other runtime import) so that the client
 * bundle does not carry the validation library; the schemas import from here, not
 * the other way round. The `import type`s below are erased at build time.
 */
import type { ContactInput, RackApplicationInput, ValetRequestInput } from "./schemas";

type Option<Value extends string> = { value: Value; label: string };

/** Every stored field (never the honeypot) with its human-readable label, in email order. */
type Labels<Input> = Record<Exclude<keyof Input, "website">, string>;

// --- Contact (Q18) -----------------------------------------------------------

export const contactFieldLabels = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email address",
  phone: "Phone number",
  message: "Message",
} as const satisfies Labels<ContactInput>;

// --- Bike valet request (Q16) ------------------------------------------------

export const organizationTypeValues = ["nonprofit", "business-member", "both", "neither"] as const;
export type OrganizationType = (typeof organizationTypeValues)[number];

export const organizationTypeOptions: Option<OrganizationType>[] = [
  { value: "nonprofit", label: "Nonprofit organization" },
  { value: "business-member", label: "Bike Coalition Business Member" },
  { value: "both", label: "Both" },
  { value: "neither", label: "Neither" },
];

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
} as const satisfies Labels<ValetRequestInput>;

// --- Bike rack application (Q17) ---------------------------------------------

export const rackStyleValues = ["bolt-down", "free-standing"] as const;
export type RackStyle = (typeof rackStyleValues)[number];

export const rackStyleOptions: Option<RackStyle>[] = [
  { value: "bolt-down", label: "Bolt-down" },
  { value: "free-standing", label: "Free-standing" },
];

export const matchingFundsValues = ["yes", "partial", "no"] as const;
export type MatchingFunds = (typeof matchingFundsValues)[number];

export const matchingFundsOptions: Option<MatchingFunds>[] = [
  { value: "yes", label: "Yes" },
  { value: "partial", label: "Partially" },
  { value: "no", label: "No" },
];

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
} as const satisfies Labels<RackApplicationInput>;
