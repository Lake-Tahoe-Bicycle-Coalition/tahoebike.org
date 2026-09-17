"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { adminListUrl } from "@/lib/admin/form";
import { prisma } from "@/lib/db";
import { readString } from "@/lib/forms/parse";
import type { SubmissionStatus } from "@/lib/generated/prisma/enums";
import { isFormType, isSubmissionStatus, submissionStatusLabels, summarize } from "./fields";
import { parseSubmissionFilters, submissionsListUrl } from "./queries";

/**
 * Plain form actions (hidden fields, no validation state): the inbox has nothing to
 * edit, only statuses to flip and rows to delete. Nothing here is public, so no
 * revalidation is needed.
 *
 * List forms carry the current filter as hidden `filterType`, `filterStatus` and `page`
 * fields so the redirect lands back on the same view; detail forms send `view=detail`.
 */

function listUrlFrom(formData: FormData, notice: string): string {
  const filters = parseSubmissionFilters({
    type: readString(formData, "filterType"),
    status: readString(formData, "filterStatus"),
    page: readString(formData, "page"),
  });
  return submissionsListUrl(filters, notice);
}

function backUrl(formData: FormData, id: string, notice: string): string {
  return readString(formData, "view") === "detail"
    ? adminListUrl(`/admin/submissions/${id}`, notice)
    : listUrlFrom(formData, notice);
}

function statusNotice(status: SubmissionStatus, summary: string): string {
  return status === "ARCHIVED" ? `Archived “${summary}”.` : `Marked “${summary}” as ${submissionStatusLabels[status].toLowerCase()}.`;
}

/** Hidden `id` and `status` (NEW, READ or ARCHIVED). */
export async function setSubmissionStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = readString(formData, "id");
  const status = readString(formData, "status");
  if (!id || !isSubmissionStatus(status)) redirect(listUrlFrom(formData, "That change could not be applied."));

  let notice: string;
  try {
    const row = await prisma.formSubmission.update({ where: { id }, data: { status } });
    notice = statusNotice(status, summarize(row.payload, row.formType));
  } catch (error) {
    console.error(`[admin] could not update submission ${id}`, error);
    redirect(listUrlFrom(formData, "That submission could not be updated; it may have been deleted."));
  }
  redirect(backUrl(formData, id, notice));
}

/** Hidden `type` ("all" or a form type) scopes it; only NEW rows change. */
export async function markAllRead(formData: FormData): Promise<void> {
  await requireAdmin();
  const type = readString(formData, "type");

  let count: number;
  try {
    const result = await prisma.formSubmission.updateMany({
      where: { status: "NEW", ...(isFormType(type) ? { formType: type } : {}) },
      data: { status: "READ" },
    });
    count = result.count;
  } catch (error) {
    console.error("[admin] could not mark submissions as read", error);
    redirect(listUrlFrom(formData, "The submissions could not be marked as read. Please try again."));
  }
  redirect(listUrlFrom(formData, count === 1 ? "Marked 1 submission as read." : `Marked ${count} submissions as read.`));
}

/** Hidden `id`, used from a <ConfirmForm>. Always returns to the list. */
export async function deleteSubmission(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = readString(formData, "id");
  if (!id) redirect(listUrlFrom(formData, "That submission could not be deleted."));

  let summary: string;
  try {
    const row = await prisma.formSubmission.delete({ where: { id } });
    summary = summarize(row.payload, row.formType);
  } catch (error) {
    console.error(`[admin] could not delete submission ${id}`, error);
    redirect(listUrlFrom(formData, "That submission could not be deleted; it may already be gone."));
  }
  redirect(listUrlFrom(formData, `Deleted “${summary}”.`));
}
