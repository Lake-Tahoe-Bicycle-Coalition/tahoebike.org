"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { adminListUrl } from "@/lib/admin/form";
import { deleteConnection } from "@/lib/constant-contact-api";

const PAGE = "/admin/settings";

/**
 * Admin actions for the Constant Contact connection. There is no list to choose: the
 * lists are fixed in lib/constant-contact-lists.ts. No revalidation either: the
 * connection is read when a visitor subscribes, never on a public page render.
 */
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
