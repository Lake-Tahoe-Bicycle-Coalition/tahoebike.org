import { prisma } from "@/lib/db";
import type { FormSubmission, Prisma } from "@/lib/generated/prisma/client";
import type { FormType } from "@/lib/generated/prisma/enums";
import { isFormType, isStatusFilter, type StatusFilter } from "./fields";

/**
 * The inbox list query and the search params that drive it. Server-side only (imports
 * the Prisma client); the list page and the actions share the URL helpers so a status
 * change lands back on the same filtered page.
 */

export const PAGE_SIZE = 25;

export type TypeFilter = FormType | "all";

export type SubmissionFilters = { type: TypeFilter; status: StatusFilter; page: number };

export const defaultFilters: SubmissionFilters = { type: "all", status: "open", page: 1 };

type ParamValue = string | string[] | undefined;

function first(value: ParamValue): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/** Search params (or hidden form fields) as validated filters; junk falls back to the defaults. */
export function parseSubmissionFilters(params: Record<string, ParamValue>): SubmissionFilters {
  const type = first(params.type);
  const status = first(params.status);
  const page = Number.parseInt(first(params.page), 10);
  return {
    type: isFormType(type) ? type : defaultFilters.type,
    status: isStatusFilter(status) ? status : defaultFilters.status,
    page: Number.isInteger(page) && page >= 1 ? page : defaultFilters.page,
  };
}

/** `/admin/submissions?…` for the given filters (defaults omitted) with an optional notice. */
export function submissionsListUrl(filters: Partial<SubmissionFilters>, notice?: string): string {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== defaultFilters.type) params.set("type", filters.type);
  if (filters.status && filters.status !== defaultFilters.status) params.set("status", filters.status);
  if (filters.page && filters.page !== defaultFilters.page) params.set("page", String(filters.page));
  if (notice) params.set("notice", notice);
  const query = params.toString();
  return query ? `/admin/submissions?${query}` : "/admin/submissions";
}

function submissionWhere(filters: Pick<SubmissionFilters, "type" | "status">): Prisma.FormSubmissionWhereInput {
  const where: Prisma.FormSubmissionWhereInput = {};
  if (filters.type !== "all") where.formType = filters.type;
  if (filters.status === "open") where.status = { in: ["NEW", "READ"] };
  else if (filters.status !== "all") where.status = filters.status;
  return where;
}

export type SubmissionPage = {
  rows: FormSubmission[];
  total: number;
  /** The page actually shown: the requested one, pulled back to the last page when it ran past the end. */
  page: number;
  pageCount: number;
  /** 1-based positions of the first and last row shown (0 when there are none). */
  from: number;
  to: number;
  /** NEW rows matching the form-type filter, whatever the status filter (what "Mark all as read" would touch). */
  newCount: number;
};

/** Newest first; the id breaks ties so paging is stable when two arrive in the same instant. */
export async function listSubmissions(filters: SubmissionFilters): Promise<SubmissionPage> {
  const where = submissionWhere(filters);
  const [total, newCount] = await Promise.all([
    prisma.formSubmission.count({ where }),
    prisma.formSubmission.count({ where: submissionWhere({ type: filters.type, status: "NEW" }) }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const rows =
    total === 0
      ? []
      : await prisma.formSubmission.findMany({
          where,
          orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        });

  const from = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = rows.length === 0 ? 0 : from + rows.length - 1;
  return { rows, total, page, pageCount, from, to, newCount };
}
