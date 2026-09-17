import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Move up / move down for the hand-ordered tables (BoardMember, HomepageCard). Rows
 * are kept at sortOrder 0..n-1 in display order: a move renumbers whatever has
 * drifted (gaps left by deletes, duplicates) and swaps the pair, in one transaction.
 */

export type MoveDirection = "up" | "down";

/** The hidden `direction` field of a move form, or null for anything else. */
export function parseMoveDirection(value: string): MoveDirection | null {
  return value === "up" || value === "down" ? value : null;
}

export type OrderedRow = { id: string; sortOrder: number };

/**
 * `rows` is the whole table in display order; `write` builds the update for one row,
 * e.g. `(id, sortOrder) => prisma.boardMember.update({ where: { id }, data: { sortOrder } })`.
 * Returns false when `id` is not in the list or is already at that end of it.
 */
export async function moveRow(
  rows: readonly OrderedRow[],
  id: string,
  direction: MoveDirection,
  write: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>,
): Promise<boolean> {
  const from = rows.findIndex((row) => row.id === id);
  if (from === -1) return false;
  const to = direction === "up" ? from - 1 : from + 1;
  const neighbour = rows[to];
  if (!neighbour) return false;

  const order = rows.map((row) => row.id);
  order[from] = neighbour.id;
  order[to] = id;

  const stored = new Map(rows.map((row) => [row.id, row.sortOrder]));
  const writes = order.flatMap((rowId, index) => (stored.get(rowId) === index ? [] : [write(rowId, index)]));
  if (writes.length > 0) await prisma.$transaction(writes);
  return true;
}
