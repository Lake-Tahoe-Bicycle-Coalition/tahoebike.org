"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { adminListUrl, formFailure, parseAdminForm } from "@/lib/admin/form";
import { revalidateEvents } from "@/lib/admin/revalidate";
import { prisma } from "@/lib/db";
import { readString } from "@/lib/forms/parse";
import type { FormState } from "@/lib/forms/state";
import { eventFieldNames } from "./fields";
import { eventSchema } from "./schema";

const LIST = "/admin/events";

export async function createEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAdminForm(formData, eventSchema, eventFieldNames);
  if (!parsed.ok) return parsed.state;

  try {
    await prisma.event.create({ data: parsed.data });
  } catch (error) {
    console.error("[admin] could not create event", error);
    return formFailure("The event could not be saved. Please try again.", parsed.values);
  }
  revalidateEvents();
  redirect(adminListUrl(LIST, `Added “${parsed.data.title}”.`));
}

export async function updateEvent(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAdminForm(formData, eventSchema, eventFieldNames);
  if (!parsed.ok) return parsed.state;

  try {
    await prisma.event.update({ where: { id }, data: parsed.data });
  } catch (error) {
    console.error(`[admin] could not update event ${id}`, error);
    return formFailure("The event could not be saved. It may have been deleted by someone else.", parsed.values);
  }
  revalidateEvents();
  redirect(adminListUrl(LIST, `Saved “${parsed.data.title}”.`));
}

/** Plain form action (hidden `id` field), used from a <ConfirmForm>. */
export async function deleteEvent(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = readString(formData, "id");
  if (!id) redirect(LIST);

  let title = "event";
  try {
    const row = await prisma.event.delete({ where: { id }, select: { title: true } });
    title = row.title;
  } catch (error) {
    console.error(`[admin] could not delete event ${id}`, error);
    redirect(adminListUrl(LIST, "That event could not be deleted; it may already be gone."));
  }
  revalidateEvents();
  redirect(adminListUrl(LIST, `Deleted “${title}”.`));
}
