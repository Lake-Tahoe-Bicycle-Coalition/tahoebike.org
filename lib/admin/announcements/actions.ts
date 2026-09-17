"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { adminListUrl, formFailure, parseAdminForm } from "@/lib/admin/form";
import { revalidateWholeSite } from "@/lib/admin/revalidate";
import { prisma } from "@/lib/db";
import { readString } from "@/lib/forms/parse";
import type { FormState } from "@/lib/forms/state";
import { announcementFieldNames } from "./fields";
import { announcementSchema } from "./schema";

const LIST = "/admin/announcements";

/** The start of the message, for notices (“Added “Bike Month starts…”.”). */
function shortMessage(message: string): string {
  return message.length > 40 ? `${message.slice(0, 40).trimEnd()}…` : message;
}

export async function createAnnouncement(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAdminForm(formData, announcementSchema, announcementFieldNames);
  if (!parsed.ok) return parsed.state;

  try {
    await prisma.announcement.create({ data: parsed.data });
  } catch (error) {
    console.error("[admin] could not create announcement", error);
    return formFailure("The announcement could not be saved. Please try again.", parsed.values);
  }
  revalidateWholeSite();
  redirect(adminListUrl(LIST, `Added “${shortMessage(parsed.data.message)}”.`));
}

export async function updateAnnouncement(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAdminForm(formData, announcementSchema, announcementFieldNames);
  if (!parsed.ok) return parsed.state;

  try {
    await prisma.announcement.update({ where: { id }, data: parsed.data });
  } catch (error) {
    console.error(`[admin] could not update announcement ${id}`, error);
    return formFailure(
      "The announcement could not be saved. It may have been deleted by someone else.",
      parsed.values,
    );
  }
  revalidateWholeSite();
  redirect(adminListUrl(LIST, `Saved “${shortMessage(parsed.data.message)}”.`));
}

/** Plain form action (hidden `id` field), used from a <ConfirmForm>. */
export async function deleteAnnouncement(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = readString(formData, "id");
  if (!id) redirect(LIST);

  let message = "announcement";
  try {
    const row = await prisma.announcement.delete({ where: { id }, select: { message: true } });
    message = shortMessage(row.message);
  } catch (error) {
    console.error(`[admin] could not delete announcement ${id}`, error);
    redirect(adminListUrl(LIST, "That announcement could not be deleted; it may already be gone."));
  }
  revalidateWholeSite();
  redirect(adminListUrl(LIST, `Deleted “${message}”.`));
}
