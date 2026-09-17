import type { z } from "zod";
import { fieldErrorsOf, pick, readStrings } from "@/lib/forms/parse";
import type { FormState } from "@/lib/forms/state";

/**
 * Shared shape of every admin create/update action:
 *
 *   export async function updateThing(id: string, _prev: FormState, formData: FormData) {
 *     await requireAdmin();
 *     const parsed = parseAdminForm(formData, thingSchema, thingFieldNames);
 *     if (!parsed.ok) return parsed.state;
 *     ... write to the database ...
 *     revalidate...();
 *     redirect(adminListUrl("/admin/things", `Saved “${title}”.`));
 *   }
 *
 * The client component binds `id` (`updateThing.bind(null, id)`) and feeds the action
 * to useActionState with `initialFormState`, exactly like the public forms.
 */

export type ParsedAdminForm<T> =
  /** `values` are the raw strings, for echoing back if a later step (the database write) fails. */
  | { ok: true; data: T; values: Record<string, string> }
  | { ok: false; state: FormState };

export function parseAdminForm<T>(
  formData: FormData,
  schema: z.ZodType<T>,
  fieldNames: readonly string[],
): ParsedAdminForm<T> {
  const raw = readStrings(formData, fieldNames);
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data, values: pick(raw, fieldNames) };
  return {
    ok: false,
    state: {
      status: "error",
      formError: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsOf(parsed.error),
      values: pick(raw, fieldNames),
    },
  };
}

/** Error state for a failure after validation (database write failed, row vanished, …). */
export function formFailure(message: string, values?: Record<string, string>): FormState {
  return { status: "error", formError: message, values };
}

/**
 * URL of an admin list page carrying a one-line confirmation that the page renders
 * with <Notice /> (components/admin/notice.tsx).
 */
export function adminListUrl(path: string, notice: string): string {
  return `${path}?notice=${encodeURIComponent(notice)}`;
}
