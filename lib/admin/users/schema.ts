import { z } from "zod";
import { email, emptyToNull, optionalLine } from "@/lib/forms/validators";

/**
 * Validates the "Add admin" form and produces the columns to write. Server-only.
 * Emails are stored lowercase because sign-in compares them that way (lib/auth.ts).
 * Admins are only added and removed, never edited, so there is no row-to-form helper.
 */
export const adminUserSchema = z
  .object({
    email: email.transform((value) => value.toLowerCase()),
    name: optionalLine("Name", 100),
  })
  .transform((data) => {
    return {
      email: data.email,
      name: emptyToNull(data.name),
    };
  });

export type AdminUserData = z.output<typeof adminUserSchema>;
