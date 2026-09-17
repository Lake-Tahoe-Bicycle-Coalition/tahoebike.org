import type { z } from "zod";

/**
 * FormData → plain strings → zod, shared by the public form actions and the admin
 * actions. Server-only (imports zod types).
 */

export function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Every listed field as a string ("" when absent, e.g. an unticked checkbox). */
export function readStrings(formData: FormData, names: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of names) out[name] = readString(formData, name);
  return out;
}

export function pick(source: Record<string, string>, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) out[key] = source[key] ?? "";
  return out;
}

/** Zod issues keyed by field name (dotted for nested paths; `_form` for form-level ones). */
export function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
