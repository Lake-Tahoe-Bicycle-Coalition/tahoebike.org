"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/lib/email";
import type { FormType } from "@/lib/generated/prisma/enums";
import { getSettings, settingIsTrue, type Settings } from "@/lib/settings";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  contactFieldLabels,
  contactSchema,
  rackApplicationFieldLabels,
  rackApplicationSchema,
  valetRequestFieldLabels,
  valetRequestSchema,
} from "./schemas";
import type { FormState } from "./state";

const HONEYPOT_FIELD = "website";
const TURNSTILE_FIELD = "cf-turnstile-response";

type Payload = Record<string, string | number>;

type SubmissionSpec<T extends Payload & { website: string }> = {
  formType: FormType;
  schema: z.ZodType<T>;
  /** Human-readable label for every stored field (never the honeypot), in email order. */
  labels: Record<Exclude<keyof T, "website"> & string, string>;
  /** Where the notification goes. */
  recipient: (settings: Settings) => string;
  subject: (data: T) => string;
  intro: string;
  /** Extra gate evaluated before anything else (e.g. "program closed"). */
  guard?: (settings: Settings) => string | null;
};

/** Contact form on /contact. */
export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleSubmission(formData, {
    formType: "CONTACT",
    schema: contactSchema,
    labels: contactFieldLabels,
    recipient: (settings) => settings.contact_email,
    subject: (data) => `[tahoebike.org] Contact form from ${data.firstName} ${data.lastName}`,
    intro: "New message from the contact form on tahoebike.org.",
  });
}

/** Bike valet request on /programs/bike-valet. */
export async function submitValetRequest(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return handleSubmission(formData, {
    formType: "VALET_REQUEST",
    schema: valetRequestSchema,
    labels: valetRequestFieldLabels,
    recipient: (settings) => settings.bike_valet_email,
    subject: (data) =>
      `[tahoebike.org] Bike valet request from ${data.contactName} (${data.eventName})`,
    intro: "New bike valet request from tahoebike.org.",
  });
}

/** Bike rack application on /bike-racks. Refused while the program is closed. */
export async function submitRackApplication(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return handleSubmission(formData, {
    formType: "RACK_APPLICATION",
    schema: rackApplicationSchema,
    labels: rackApplicationFieldLabels,
    recipient: (settings) => settings.contact_email,
    subject: (data) => `[tahoebike.org] Bike rack application from ${data.businessName}`,
    intro: "New Regional Bicycle Parking Program application from tahoebike.org.",
    guard: (settings) =>
      settingIsTrue(settings.rack_program_open)
        ? null
        : "The Regional Bicycle Parking Program is not currently accepting applications.",
  });
}

/**
 * Shared pipeline: guard -> honeypot -> validate -> Turnstile -> store -> notify.
 * A stored submission is never lost because of a mail failure.
 */
async function handleSubmission<T extends Payload & { website: string }>(
  formData: FormData,
  spec: SubmissionSpec<T>,
): Promise<FormState> {
  const settings = await getSettings();

  const refusal = spec.guard?.(settings);
  if (refusal) return { status: "error", formError: refusal };

  // Bots fill the hidden field. Pretend it worked; store nothing.
  if (readString(formData, HONEYPOT_FIELD) !== "") {
    console.info(`[forms] ${spec.formType}: honeypot triggered, submission dropped`);
    return { status: "success" };
  }

  const fieldNames = Object.keys(spec.labels);
  const raw: Record<string, string> = {};
  for (const name of [...fieldNames, HONEYPOT_FIELD]) {
    raw[name] = readString(formData, name);
  }

  const parsed = spec.schema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      formError: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
      values: pick(raw, fieldNames),
    };
  }

  const turnstile = await verifyTurnstile(
    readString(formData, TURNSTILE_FIELD) || null,
    await clientIp(),
  );
  if (!turnstile.ok) {
    console.warn(`[forms] ${spec.formType}: ${turnstile.error}`);
    return {
      status: "error",
      formError: "We could not verify that you are a person. Please try again.",
      values: pick(raw, fieldNames),
    };
  }

  // Only the labelled fields are stored: never the honeypot or the Turnstile token.
  const payload: Payload = {};
  for (const name of fieldNames) {
    const value = parsed.data[name as keyof T];
    if (typeof value === "string" || typeof value === "number") payload[name] = value;
  }

  let submissionId: string;
  let submittedAt: Date;
  try {
    const row = await prisma.formSubmission.create({
      data: { formType: spec.formType, payload },
      select: { id: true, submittedAt: true },
    });
    submissionId = row.id;
    submittedAt = row.submittedAt;
  } catch (error) {
    console.error(`[forms] ${spec.formType}: could not store submission`, error);
    return {
      status: "error",
      formError: `Something went wrong and your submission was not saved. Please try again or email ${settings.contact_email}.`,
      values: pick(raw, fieldNames),
    };
  }

  try {
    await getEmailProvider().send({
      to: spec.recipient(settings),
      subject: spec.subject(parsed.data),
      text: formatEmail(spec.intro, spec.labels, payload, submissionId, submittedAt),
      replyTo: typeof payload.email === "string" ? payload.email : undefined,
    });
  } catch (error) {
    // The submission is already in the database; the admin inbox still shows it.
    console.error(
      `[forms] ${spec.formType}: notification email failed for submission ${submissionId}`,
      error,
    );
  }

  return { status: "success" };
}

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function pick(source: Record<string, string>, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) out[key] = source[key] ?? "";
  return out;
}

function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function formatEmail(
  intro: string,
  labels: Record<string, string>,
  payload: Payload,
  submissionId: string,
  submittedAt: Date,
): string {
  const lines = Object.entries(labels).map(([name, label]) => {
    const value = payload[name];
    const text = value === undefined || value === "" ? "(not provided)" : String(value);
    return text.includes("\n") ? `${label}:\n${text}` : `${label}: ${text}`;
  });
  return [
    intro,
    "",
    ...lines,
    "",
    `Submission ID: ${submissionId}`,
    `Submitted: ${submittedAt.toISOString()}`,
  ].join("\n");
}

/** Best-effort client IP for Turnstile; undefined outside a request (e.g. scripts). */
async function clientIp(): Promise<string | undefined> {
  try {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded || requestHeaders.get("x-real-ip") || undefined;
  } catch {
    return undefined;
  }
}
