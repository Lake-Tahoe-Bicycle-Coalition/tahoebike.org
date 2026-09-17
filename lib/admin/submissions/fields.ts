import {
  contactFieldLabels,
  matchingFundsOptions,
  organizationTypeOptions,
  rackApplicationFieldLabels,
  rackStyleOptions,
  valetRequestFieldLabels,
} from "@/lib/forms/fields";
import type { FormType, SubmissionStatus } from "@/lib/generated/prisma/enums";

/**
 * Labels, option lists and payload helpers for the submissions inbox. Zod-free; the
 * pages and the actions import from here. The payload is whatever lib/forms/actions.ts
 * stored, so everything that reads it treats it as untyped JSON.
 */

export const formTypeValues = ["CONTACT", "VALET_REQUEST", "RACK_APPLICATION"] as const satisfies readonly FormType[];

export const formTypeLabels: Record<FormType, string> = {
  CONTACT: "Contact form",
  VALET_REQUEST: "Bike valet request",
  RACK_APPLICATION: "Bike rack application",
};

/** Plural nouns for sentences such as "No archived bike valet requests." */
export const formTypeNouns: Record<FormType, string> = {
  CONTACT: "contact form messages",
  VALET_REQUEST: "bike valet requests",
  RACK_APPLICATION: "bike rack applications",
};

export const formTypeOptions = formTypeValues.map((value) => ({ value, label: formTypeLabels[value] }));

export function isFormType(value: string): value is FormType {
  return (formTypeValues as readonly string[]).includes(value);
}

export const submissionStatusValues = ["NEW", "READ", "ARCHIVED"] as const satisfies readonly SubmissionStatus[];

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  NEW: "New",
  READ: "Read",
  ARCHIVED: "Archived",
};

/** Badge styling per status: new stands out, read is plain, archived is muted. */
export const submissionStatusBadgeClass: Record<SubmissionStatus, string> = {
  NEW: "badge badge-active",
  READ: "badge",
  ARCHIVED: "badge opacity-60",
};

export function isSubmissionStatus(value: string): value is SubmissionStatus {
  return (submissionStatusValues as readonly string[]).includes(value);
}

/** The list's status filter: "open" (new and read together) is the default view. */
export const statusFilterValues = ["open", ...submissionStatusValues, "all"] as const;
export type StatusFilter = (typeof statusFilterValues)[number];

export const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "open", label: "Open (new and read)" },
  { value: "NEW", label: "New" },
  { value: "READ", label: "Read" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "all", label: "All" },
];

export function isStatusFilter(value: string): value is StatusFilter {
  return (statusFilterValues as readonly string[]).includes(value);
}

/** Field → label for each form type, in the order the public form and the notification email use. */
export const payloadFieldLabels: Record<FormType, Record<string, string>> = {
  CONTACT: contactFieldLabels,
  VALET_REQUEST: valetRequestFieldLabels,
  RACK_APPLICATION: rackApplicationFieldLabels,
};

type Option = { value: string; label: string };

/** Fields the public forms offer as a choice, so the inbox can show the label rather than the stored value. */
const payloadOptions: Partial<Record<FormType, Record<string, readonly Option[]>>> = {
  VALET_REQUEST: { organizationType: organizationTypeOptions },
  RACK_APPLICATION: { rackStyle: rackStyleOptions, matchingFunds: matchingFundsOptions },
};

/** A payload value as text: the option's label when the field is a choice, otherwise the value itself. */
export function formatPayloadValue(formType: FormType, key: string, value: string | number): string {
  const options = payloadOptions[formType]?.[key];
  return options?.find((option) => option.value === value)?.label ?? String(value);
}

/** Subject line prefilled on the "Reply by email" link. */
export const replySubjects: Record<FormType, string> = {
  CONTACT: "Re: your message to the Lake Tahoe Bicycle Coalition",
  VALET_REQUEST: "Re: your bike valet request to the Lake Tahoe Bicycle Coalition",
  RACK_APPLICATION: "Re: your bike rack application to the Lake Tahoe Bicycle Coalition",
};

export type SubmissionPayload = Record<string, string | number>;

/** The stored JSON as a flat record; anything that is not a string or number is dropped. */
export function payloadOf(json: unknown): SubmissionPayload {
  const out: SubmissionPayload = {};
  if (typeof json !== "object" || json === null || Array.isArray(json)) return out;
  for (const [key, value] of Object.entries(json)) {
    if (typeof value === "string" || typeof value === "number") out[key] = value;
  }
  return out;
}

/** The submitter's email address, when the payload has one. */
export function emailOf(payload: SubmissionPayload): string | null {
  const email = payload.email;
  return typeof email === "string" && email.includes("@") ? email : null;
}

function text(payload: SubmissionPayload, key: string): string {
  const value = payload[key];
  return value === undefined ? "" : String(value).trim();
}

/** Joins the non-empty parts ("Jane – Spring Fest", or just "Jane" when the event is missing). */
function join(parts: string[], separator: string): string {
  return parts.filter((part) => part !== "").join(separator);
}

/**
 * One line saying who a submission is from, for the list and for notices:
 * contact "First Last <email>", valet "Contact – Event", rack "Business – Contact".
 * Falls back to the email address, then to the form's name, so a row is never blank.
 */
export function summarize(json: unknown, formType: FormType): string {
  const payload = payloadOf(json);
  let summary: string;
  switch (formType) {
    case "CONTACT": {
      const name = join([text(payload, "firstName"), text(payload, "lastName")], " ");
      const email = text(payload, "email");
      summary = name && email ? `${name} <${email}>` : name || email;
      break;
    }
    case "VALET_REQUEST":
      summary = join([text(payload, "contactName"), text(payload, "eventName")], " – ");
      break;
    case "RACK_APPLICATION":
      summary = join([text(payload, "businessName"), text(payload, "contactName")], " – ");
      break;
  }
  return summary || text(payload, "email") || formTypeLabels[formType];
}
