import Link from "next/link";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { formatAdminDateTime } from "@/lib/admin/datetime";
import { markAllRead, setSubmissionStatus } from "@/lib/admin/submissions/actions";
import {
  formTypeLabels,
  formTypeNouns,
  formTypeOptions,
  statusFilterOptions,
  submissionStatusBadgeClass,
  submissionStatusLabels,
  summarize,
  type StatusFilter,
} from "@/lib/admin/submissions/fields";
import {
  listSubmissions,
  parseSubmissionFilters,
  submissionsListUrl,
  type SubmissionFilters,
} from "@/lib/admin/submissions/queries";
import type { SubmissionStatus } from "@/lib/generated/prisma/enums";

/** The one-click change offered on a row: forward through new → read → archived, and back out of the archive. */
const rowAction: Record<SubmissionStatus, { status: SubmissionStatus; label: string }> = {
  NEW: { status: "READ", label: "Mark read" },
  READ: { status: "ARCHIVED", label: "Archive" },
  ARCHIVED: { status: "READ", label: "Restore" },
};

const statusAdjective: Record<StatusFilter, string> = {
  open: "open",
  NEW: "new",
  READ: "read",
  ARCHIVED: "archived",
  all: "",
};

function emptyMessage(filters: SubmissionFilters): string {
  const noun = filters.type === "all" ? "submissions" : formTypeNouns[filters.type];
  return filters.status === "all" ? `No ${noun} yet.` : `No ${statusAdjective[filters.status]} ${noun}.`;
}

/** Carries the current view through a form action so the redirect lands back here. */
function FilterFields({ filters }: { filters: SubmissionFilters }) {
  return (
    <>
      <input type="hidden" name="filterType" value={filters.type} />
      <input type="hidden" name="filterStatus" value={filters.status} />
      <input type="hidden" name="page" value={filters.page} />
    </>
  );
}

export default async function SubmissionsPage({ searchParams }: PageProps<"/admin/submissions">) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseSubmissionFilters(params);
  const list = await listSubmissions(filters);
  // The page actually shown, in case the requested one ran past the end.
  const view: SubmissionFilters = { ...filters, page: list.page };

  const markAllMessage =
    (list.newCount === 1 ? "Mark the 1 new submission as read?" : `Mark all ${list.newCount} new submissions as read?`) +
    (filters.type === "all" ? "" : ` Only ${formTypeNouns[filters.type]} are affected.`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissions"
        description="Messages from the contact form, bike valet requests and bike rack applications. Each one was also emailed when it arrived. Nothing here is public; times are Pacific."
        action={
          list.newCount > 0 ? (
            <ConfirmForm action={markAllRead} message={markAllMessage}>
              <input type="hidden" name="type" value={filters.type} />
              <FilterFields filters={view} />
              <button type="submit" className="btn btn-secondary">
                Mark all as read
              </button>
            </ConfirmForm>
          ) : null
        }
      />
      <Notice notice={params.notice} />

      <form method="get" className="flex flex-wrap items-end gap-4">
        <div className="w-full sm:w-56">
          <label htmlFor="filter-type" className="field-label">
            Form
          </label>
          <select id="filter-type" name="type" className="field-input" defaultValue={filters.type}>
            <option value="all">All forms</option>
            {formTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-56">
          <label htmlFor="filter-status" className="field-label">
            Status
          </label>
          <select id="filter-status" name="status" className="field-input" defaultValue={filters.status}>
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Apply
        </button>
      </form>

      {list.rows.length === 0 ? (
        <p>{emptyMessage(filters)}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Received</th>
                  <th scope="col">Form</th>
                  <th scope="col">From</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => {
                  const next = rowAction[row.status];
                  return (
                    <tr key={row.id} className={row.status === "NEW" ? "font-semibold" : undefined}>
                      <td className="whitespace-nowrap">{formatAdminDateTime(row.submittedAt)}</td>
                      <td>{formTypeLabels[row.formType]}</td>
                      <td>
                        <Link href={`/admin/submissions/${row.id}`}>{summarize(row.payload, row.formType)}</Link>
                      </td>
                      <td>
                        <span className={submissionStatusBadgeClass[row.status]}>{submissionStatusLabels[row.status]}</span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <Link href={`/admin/submissions/${row.id}`}>View</Link>
                          <form action={setSubmissionStatus}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="status" value={next.status} />
                            <FilterFields filters={view} />
                            <button type="submit">{next.label}</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <p>
              Showing {list.from}–{list.to} of {list.total}
            </p>
            {list.pageCount > 1 ? (
              <p className="flex gap-4 font-semibold">
                {list.page > 1 ? (
                  <Link href={submissionsListUrl({ ...view, page: list.page - 1 })}>Previous</Link>
                ) : (
                  <span className="text-asphalt/40">Previous</span>
                )}
                <span>
                  Page {list.page} of {list.pageCount}
                </span>
                {list.page < list.pageCount ? (
                  <Link href={submissionsListUrl({ ...view, page: list.page + 1 })}>Next</Link>
                ) : (
                  <span className="text-asphalt/40">Next</span>
                )}
              </p>
            ) : null}
          </nav>
        </>
      )}
    </div>
  );
}
