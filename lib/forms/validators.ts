import { z } from "zod";
import { isSitePath } from "@/lib/urls";

/**
 * Zod building blocks shared by the public forms (./schemas.ts) and the admin forms
 * (lib/admin/*). Every input arrives as a string from FormData; these turn it into
 * a trimmed, bounded value with a human-readable message for each failure.
 *
 * Server-only: never import from a client component (it would pull zod into the
 * browser bundle).
 */

/** Multi-line text (textarea). */
export function requiredText(label: string, max: number) {
  return z
    .string(`${label} is required.`)
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);
}

/** Multi-line text (textarea), may be empty. */
export function optionalText(label: string, max: number) {
  return z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);
}

/**
 * Single-line values must not contain line breaks: several of them end up in email
 * subjects, where an injected CR/LF could add headers.
 */
const NO_LINE_BREAKS = /^[^\r\n]*$/;

export function requiredLine(label: string, max: number) {
  return requiredText(label, max).regex(NO_LINE_BREAKS, { error: `${label} must be a single line.` });
}

export function optionalLine(label: string, max: number) {
  return optionalText(label, max).regex(NO_LINE_BREAKS, { error: `${label} must be a single line.` });
}

export const email = z
  .string("Email address is required.")
  .trim()
  .min(1, "Email address is required.")
  .max(254, "Email address must be 254 characters or fewer.")
  .pipe(z.email("Enter a valid email address."));

export function wholeNumber(label: string, max: number, min = 1) {
  return z
    .string(`${label} is required.`)
    .trim()
    .min(1, `${label} is required.`)
    .regex(/^\d+$/, `${label} must be a whole number.`)
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(min, `${label} must be at least ${min}.`)
        .max(max, `${label} must be ${max} or less.`),
    );
}

/**
 * A link the site can render: an absolute http(s) URL, a site path such as `/join`
 * or `/join#newsletter`, or a `mailto:`/`tel:` address.
 */
function isRenderableLink(value: string): boolean {
  if (isSitePath(value)) return true;
  if (/^(mailto|tel):.+/i.test(value)) return true;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

const LINK_MESSAGE = "Enter a full web address (https://…) or a site path such as /join.";

export function requiredLink(label: string, max = 2000) {
  return requiredLine(label, max).refine(isRenderableLink, { error: LINK_MESSAGE });
}

/** Optional link; an empty string means "none". */
export function optionalLink(label: string, max = 2000) {
  return optionalLine(label, max).refine((value) => value === "" || isRenderableLink(value), {
    error: LINK_MESSAGE,
  });
}

/** An `<input type="checkbox">`: browsers send "on" when ticked and omit the field otherwise. */
export const checkbox = z
  .string()
  .optional()
  .transform((value) => value === "on" || value === "true" || value === "1");

/** Converts "" to null so optional single-line fields can be stored as nullable columns. */
export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}
