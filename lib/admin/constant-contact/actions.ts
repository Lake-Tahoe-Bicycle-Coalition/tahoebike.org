"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { adminListUrl } from "@/lib/admin/form";
import { deleteConnection, fetchContactLists, setNewsletterList } from "@/lib/constant-contact-api";
import { readString } from "@/lib/forms/parse";

const PAGE = "/admin/settings";

/** No revalidation: the connection is read when a visitor subscribes, never on a page render. */
export async function saveNewsletterList(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = z.uuid().safeParse(readString(formData, "listId"));
  if (!parsed.success) redirect(adminListUrl(PAGE, "Choose a list.", "error"));

  let name: string | undefined;
  try {
    name = (await fetchContactLists()).find((list) => list.listId === parsed.data)?.name;
    if (name) await setNewsletterList(parsed.data);
  } catch (error) {
    console.error("[admin] could not save the newsletter list", error);
    redirect(adminListUrl(PAGE, "The newsletter list could not be saved. Please try again.", "error"));
  }
  if (!name) redirect(adminListUrl(PAGE, "That list is not in the Constant Contact account.", "error"));
  redirect(adminListUrl(PAGE, `Newsletter signups now go to the “${name}” list.`));
}

export async function disconnectConstantContact(): Promise<void> {
  await requireAdmin();
  try {
    await deleteConnection();
  } catch (error) {
    console.error("[admin] could not disconnect Constant Contact", error);
    redirect(adminListUrl(PAGE, "Constant Contact could not be disconnected. Please try again.", "error"));
  }
  redirect(adminListUrl(PAGE, "Disconnected Constant Contact. Newsletter signups now go through its signup page."));
}
