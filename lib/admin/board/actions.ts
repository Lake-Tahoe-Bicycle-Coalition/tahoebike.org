"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteBlobIfOurs } from "@/lib/admin/blob";
import { adminListUrl, formFailure, parseAdminForm } from "@/lib/admin/form";
import { moveRow, parseMoveDirection } from "@/lib/admin/reorder";
import { revalidateBoard } from "@/lib/admin/revalidate";
import { prisma } from "@/lib/db";
import { readString } from "@/lib/forms/parse";
import type { FormState } from "@/lib/forms/state";
import { boardMemberFieldNames } from "./fields";
import { boardMemberSchema } from "./schema";

const LIST = "/admin/board";

export async function createBoardMember(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAdminForm(formData, boardMemberSchema, boardMemberFieldNames);
  if (!parsed.ok) return parsed.state;

  try {
    // New members go to the end of the list; "Move up" puts them where they belong.
    const last = await prisma.boardMember.aggregate({ _max: { sortOrder: true } });
    await prisma.boardMember.create({ data: { ...parsed.data, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  } catch (error) {
    console.error("[admin] could not create board member", error);
    return formFailure("The board member could not be saved. Please try again.", parsed.values);
  }
  revalidateBoard();
  redirect(adminListUrl(LIST, `Added “${parsed.data.name}”.`));
}

export async function updateBoardMember(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAdminForm(formData, boardMemberSchema, boardMemberFieldNames);
  if (!parsed.ok) return parsed.state;

  let previousPhotoUrl: string | null = null;
  try {
    const before = await prisma.boardMember.findUnique({ where: { id }, select: { photoUrl: true } });
    if (!before) throw new Error("row not found");
    previousPhotoUrl = before.photoUrl;
    await prisma.boardMember.update({ where: { id }, data: parsed.data });
  } catch (error) {
    console.error(`[admin] could not update board member ${id}`, error);
    return formFailure(
      "The board member could not be saved. They may have been deleted by someone else.",
      parsed.values,
    );
  }
  if (previousPhotoUrl !== parsed.data.photoUrl) await deleteBlobIfOurs(previousPhotoUrl);
  revalidateBoard();
  redirect(adminListUrl(LIST, `Saved “${parsed.data.name}”.`));
}

/** Plain form action (hidden `id` field), used from a <ConfirmForm>. */
export async function deleteBoardMember(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = readString(formData, "id");
  if (!id) redirect(LIST);

  let name = "board member";
  let photoUrl: string | null = null;
  try {
    const row = await prisma.boardMember.delete({ where: { id }, select: { name: true, photoUrl: true } });
    name = row.name;
    photoUrl = row.photoUrl;
  } catch (error) {
    console.error(`[admin] could not delete board member ${id}`, error);
    redirect(adminListUrl(LIST, "That board member could not be deleted; they may already be gone."));
  }
  await deleteBlobIfOurs(photoUrl);
  revalidateBoard();
  redirect(adminListUrl(LIST, `Deleted “${name}”.`));
}

/** Plain form action (hidden `id` field): hides an active member from the site, or shows an inactive one. */
export async function toggleBoardMemberActive(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = readString(formData, "id");
  if (!id) redirect(LIST);

  let row: { name: string; isActive: boolean } | null = null;
  try {
    row = await prisma.boardMember.findUnique({ where: { id }, select: { name: true, isActive: true } });
    if (row) await prisma.boardMember.update({ where: { id }, data: { isActive: !row.isActive } });
  } catch (error) {
    console.error(`[admin] could not toggle board member ${id}`, error);
    row = null;
  }
  if (!row) redirect(adminListUrl(LIST, "That board member could not be updated; they may have been deleted."));
  revalidateBoard();
  redirect(adminListUrl(LIST, row.isActive ? `Deactivated “${row.name}”.` : `Activated “${row.name}”.`));
}

/** Plain form action (hidden `id` and `direction` fields): swaps the member with its neighbour. */
export async function moveBoardMember(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = readString(formData, "id");
  const direction = parseMoveDirection(readString(formData, "direction"));
  if (!id || !direction) redirect(LIST);

  let moved = false;
  try {
    const rows = await prisma.boardMember.findMany({
      select: { id: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    moved = await moveRow(rows, id, direction, (rowId, sortOrder) =>
      prisma.boardMember.update({ where: { id: rowId }, data: { sortOrder } }),
    );
  } catch (error) {
    console.error(`[admin] could not move board member ${id}`, error);
    redirect(adminListUrl(LIST, "The order could not be changed. Please try again."));
  }
  if (moved) revalidateBoard();
  redirect(LIST);
}
