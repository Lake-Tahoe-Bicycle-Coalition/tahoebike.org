"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { adminListUrl, formFailure, parseAdminForm } from "@/lib/admin/form";
import { prisma } from "@/lib/db";
import { readString } from "@/lib/forms/parse";
import type { FormState } from "@/lib/forms/state";
import { Prisma } from "@/lib/generated/prisma/client";
import { adminUserFieldNames } from "./fields";
import { adminUserSchema } from "./schema";

const LIST = "/admin/users";

/** Prisma's "unique constraint failed" (the email column). */
function isDuplicate(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** No revalidation: the allowlist is read at sign-in, never on a public page. */
export async function addAdminUser(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAdminForm(formData, adminUserSchema, adminUserFieldNames);
  if (!parsed.ok) return parsed.state;

  try {
    await prisma.adminUser.create({ data: parsed.data });
  } catch (error) {
    if (isDuplicate(error)) {
      return {
        status: "error",
        formError: "Please correct the highlighted fields.",
        fieldErrors: { email: ["That address is already an admin."] },
        values: parsed.values,
      };
    }
    console.error("[admin] could not add admin user", error);
    return formFailure("The admin could not be added. Please try again.", parsed.values);
  }
  redirect(adminListUrl(LIST, `Added ${parsed.data.email}. They can sign in with that Google account from now on.`));
}

/**
 * Plain form action (hidden `id` field), used from a <ConfirmForm>. Refuses to remove
 * the signed-in admin or the last remaining one, so nobody can lock everyone out.
 */
export async function removeAdminUser(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = readString(formData, "id");
  if (!id) redirect(LIST);

  let row: { email: string } | null = null;
  let total = 0;
  try {
    [row, total] = await Promise.all([
      prisma.adminUser.findUnique({ where: { id }, select: { email: true } }),
      prisma.adminUser.count(),
    ]);
  } catch (error) {
    console.error(`[admin] could not look up admin user ${id}`, error);
    redirect(adminListUrl(LIST, "The admin list could not be read. Please try again."));
  }
  if (!row) redirect(adminListUrl(LIST, "That admin could not be removed; they may already be gone."));
  if (row.email === me.email) redirect(adminListUrl(LIST, "You cannot remove yourself. Ask another admin to do it."));
  if (total <= 1) redirect(adminListUrl(LIST, "You cannot remove the last admin. Add another one first."));

  try {
    await prisma.adminUser.delete({ where: { id } });
  } catch (error) {
    console.error(`[admin] could not remove admin user ${id}`, error);
    redirect(adminListUrl(LIST, "That admin could not be removed; they may already be gone."));
  }
  redirect(adminListUrl(LIST, `Removed ${row.email}. They can no longer sign in.`));
}
