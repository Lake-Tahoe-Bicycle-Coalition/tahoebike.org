/**
 * Field list for the "Add admin" form, shared by the client component
 * (components/admin/admin-user-form.tsx) and the server schema (./schema.ts). Zod-free.
 */

export const adminUserFieldNames = ["email", "name"] as const;

export type AdminUserFieldName = (typeof adminUserFieldNames)[number];

/** The form's string values (what the inputs hold), as opposed to the database row. */
export type AdminUserFormValues = Record<AdminUserFieldName, string>;

export const emptyAdminUserFormValues: AdminUserFormValues = {
  email: "",
  name: "",
};

/** The seed script inserts placeholder admins at this domain; they cannot sign in. */
export function isPlaceholderAdmin(email: string): boolean {
  return email.toLowerCase().endsWith("@example.com");
}
