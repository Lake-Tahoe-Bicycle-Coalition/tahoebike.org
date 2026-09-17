"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteBlobIfOurs } from "@/lib/admin/blob";
import { adminListUrl, formFailure, parseAdminForm } from "@/lib/admin/form";
import { moveRow, parseMoveDirection } from "@/lib/admin/reorder";
import { revalidateHomepageCards } from "@/lib/admin/revalidate";
import { prisma } from "@/lib/db";
import { readString } from "@/lib/forms/parse";
import type { FormState } from "@/lib/forms/state";
import { homepageCardFieldNames } from "./fields";
import { homepageCardSchema } from "./schema";

const LIST = "/admin/cards";

export async function createHomepageCard(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAdminForm(formData, homepageCardSchema, homepageCardFieldNames);
  if (!parsed.ok) return parsed.state;

  try {
    // New cards go to the end of the list; "Move up" puts them where they belong.
    const last = await prisma.homepageCard.aggregate({ _max: { sortOrder: true } });
    await prisma.homepageCard.create({ data: { ...parsed.data, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  } catch (error) {
    console.error("[admin] could not create homepage card", error);
    return formFailure("The card could not be saved. Please try again.", parsed.values);
  }
  revalidateHomepageCards();
  redirect(adminListUrl(LIST, `Added “${parsed.data.title}”.`));
}

export async function updateHomepageCard(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAdminForm(formData, homepageCardSchema, homepageCardFieldNames);
  if (!parsed.ok) return parsed.state;

  let previousImageUrl: string | null = null;
  try {
    const before = await prisma.homepageCard.findUnique({ where: { id }, select: { imageUrl: true } });
    if (!before) throw new Error("row not found");
    previousImageUrl = before.imageUrl;
    await prisma.homepageCard.update({ where: { id }, data: parsed.data });
  } catch (error) {
    console.error(`[admin] could not update homepage card ${id}`, error);
    return formFailure("The card could not be saved. It may have been deleted by someone else.", parsed.values);
  }
  if (previousImageUrl !== parsed.data.imageUrl) await deleteBlobIfOurs(previousImageUrl);
  revalidateHomepageCards();
  redirect(adminListUrl(LIST, `Saved “${parsed.data.title}”.`));
}

/** Plain form action (hidden `id` field), used from a <ConfirmForm>. */
export async function deleteHomepageCard(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = readString(formData, "id");
  if (!id) redirect(LIST);

  let title = "card";
  let imageUrl: string | null = null;
  try {
    const row = await prisma.homepageCard.delete({ where: { id }, select: { title: true, imageUrl: true } });
    title = row.title;
    imageUrl = row.imageUrl;
  } catch (error) {
    console.error(`[admin] could not delete homepage card ${id}`, error);
    redirect(adminListUrl(LIST, "That card could not be deleted; it may already be gone."));
  }
  await deleteBlobIfOurs(imageUrl);
  revalidateHomepageCards();
  redirect(adminListUrl(LIST, `Deleted “${title}”.`));
}

/** Plain form action (hidden `id` field): hides an active card from the home page, or shows an inactive one. */
export async function toggleHomepageCardActive(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = readString(formData, "id");
  if (!id) redirect(LIST);

  let row: { title: string; isActive: boolean } | null = null;
  try {
    row = await prisma.homepageCard.findUnique({ where: { id }, select: { title: true, isActive: true } });
    if (row) await prisma.homepageCard.update({ where: { id }, data: { isActive: !row.isActive } });
  } catch (error) {
    console.error(`[admin] could not toggle homepage card ${id}`, error);
    row = null;
  }
  if (!row) redirect(adminListUrl(LIST, "That card could not be updated; it may have been deleted."));
  revalidateHomepageCards();
  redirect(adminListUrl(LIST, row.isActive ? `Deactivated “${row.title}”.` : `Activated “${row.title}”.`));
}

/** Plain form action (hidden `id` and `direction` fields): swaps the card with its neighbour. */
export async function moveHomepageCard(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = readString(formData, "id");
  const direction = parseMoveDirection(readString(formData, "direction"));
  if (!id || !direction) redirect(LIST);

  let moved = false;
  try {
    const rows = await prisma.homepageCard.findMany({
      select: { id: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    moved = await moveRow(rows, id, direction, (rowId, sortOrder) =>
      prisma.homepageCard.update({ where: { id: rowId }, data: { sortOrder } }),
    );
  } catch (error) {
    console.error(`[admin] could not move homepage card ${id}`, error);
    redirect(adminListUrl(LIST, "The order could not be changed. Please try again."));
  }
  if (moved) revalidateHomepageCards();
  redirect(LIST);
}
