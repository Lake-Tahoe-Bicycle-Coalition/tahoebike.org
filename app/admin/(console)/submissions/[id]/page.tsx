import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { formatAdminDateTime } from "@/lib/admin/datetime";
import { deleteSubmission, setSubmissionStatus } from "@/lib/admin/submissions/actions";
import {
  emailOf,
  formatPayloadValue,
  formTypeLabels,
  payloadFieldLabels,
  payloadOf,
  replySubjects,
  submissionStatusBadgeClass,
  submissionStatusLabels,
  submissionStatusValues,
  summarize,
} from "@/lib/admin/submissions/fields";
import { prisma } from "@/lib/db";
import type { SubmissionStatus } from "@/lib/generated/prisma/enums";

const statusButtonLabels: Record<SubmissionStatus, string> = {
  NEW: "Mark as new",
  READ: "Mark as read",
  ARCHIVED: "Archive",
};

/** `mailto:` keeping the "@" readable; the subject is per form type. */
function replyHref(email: string, subject: string): string {
  return `mailto:${encodeURIComponent(email).replaceAll("%40", "@")}?subject=${encodeURIComponent(subject)}`;
}

export default async function SubmissionPage({ params, searchParams }: PageProps<"/admin/submissions/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { notice } = await searchParams;
  const row = await prisma.formSubmission.findUnique({ where: { id } });
  if (!row) notFound();

  const payload = payloadOf(row.payload);
  const labels = payloadFieldLabels[row.formType];
  // Every labelled field in form order, then anything else the payload happens to hold.
  const fields = [
    ...Object.entries(labels).map(([key, label]) => ({ key, label, value: payload[key] })),
    ...Object.keys(payload)
      .filter((key) => !Object.hasOwn(labels, key))
      .map((key) => ({ key, label: key, value: payload[key] })),
  ];
  const email = emailOf(payload);
  const summary = summarize(row.payload, row.formType);

  return (
    <div className="space-y-6">
      <PageHeader
        title={formTypeLabels[row.formType]}
        description={
          <>
            Received {formatAdminDateTime(row.submittedAt)} (Pacific).{" "}
            <span className={submissionStatusBadgeClass[row.status]}>{submissionStatusLabels[row.status]}</span>
          </>
        }
        action={
          <Link href="/admin/submissions" className="btn btn-secondary">
            Back to submissions
          </Link>
        }
      />
      <Notice notice={notice} />

      <dl className="divide-y divide-asphalt/10 rounded-lg border border-asphalt/15">
        {fields.map((field) => (
          <div key={field.key} className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:gap-6">
            <dt className="font-semibold">{field.label}</dt>
            <dd className="whitespace-pre-wrap break-words">
              {field.value === undefined || field.value === "" ? (
                <span className="text-asphalt/60">(not provided)</span>
              ) : (
                formatPayloadValue(row.formType, field.key, field.value)
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        {email ? (
          <a href={replyHref(email, replySubjects[row.formType])} className="btn btn-primary">
            Reply by email
          </a>
        ) : null}
        {submissionStatusValues
          .filter((status) => status !== row.status)
          .map((status) => (
            <form key={status} action={setSubmissionStatus}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="view" value="detail" />
              <button type="submit" className="btn btn-secondary">
                {statusButtonLabels[status]}
              </button>
            </form>
          ))}
      </div>
      <p className="text-sm text-asphalt/70">
        Opening a submission does not change its status; use the buttons. Replies are sent from your own email
        program.
      </p>

      <section className="border-t border-asphalt/15 pt-6">
        <h2 className="text-lg sm:text-lg">Delete this submission</h2>
        <p className="mt-1 text-sm text-asphalt/80">
          Deletion is permanent. The notification email sent when it arrived is the only other copy.
        </p>
        <ConfirmForm
          action={deleteSubmission}
          message={`Delete the submission from “${summary}”? This cannot be undone.`}
          className="mt-3"
        >
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className="btn btn-secondary border-red-700 text-red-700 hover:bg-red-700 hover:text-white">
            Delete submission
          </button>
        </ConfirmForm>
      </section>
    </div>
  );
}
