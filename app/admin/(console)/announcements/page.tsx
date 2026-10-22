import Link from "next/link";
import { ActionButton } from "@/components/admin/action-button";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { deleteAnnouncement } from "@/lib/admin/announcements/actions";
import {
  announcementStatuses,
  announcementStatusLabels,
  type AnnouncementStatus,
} from "@/lib/admin/announcements/fields";
import { requireAdmin } from "@/lib/admin/auth";
import { formatAdminDateTime } from "@/lib/admin/datetime";
import { prisma } from "@/lib/db";

const MESSAGE_PREVIEW = 90;

const statusClass: Record<AnnouncementStatus, string> = {
  live: "badge badge-active",
  hidden: "badge badge-warn",
  scheduled: "badge",
  expired: "badge text-asphalt/60",
};

function preview(message: string): string {
  return message.length > MESSAGE_PREVIEW ? `${message.slice(0, MESSAGE_PREVIEW).trimEnd()}…` : message;
}

export default async function AnnouncementsPage({ searchParams }: PageProps<"/admin/announcements">) {
  await requireAdmin();
  const query = await searchParams;
  const now = new Date();

  const announcements = await prisma.announcement.findMany({ orderBy: { startsAt: "desc" } });
  const statuses = announcementStatuses(announcements, now);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="The yellow banner at the top of every page. Only one shows at a time: the one that started most recently. Expired announcements stay in this list until you delete them. Times are Pacific."
        action={
          <Link href="/admin/announcements/new" className="btn btn-primary">
            New announcement
          </Link>
        }
      />
      <Notice params={query} />

      {announcements.length === 0 ? (
        <p>No announcements. Add one to show a banner on the site.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Message</th>
                <th scope="col">Link</th>
                <th scope="col">Starts</th>
                <th scope="col">Ends</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement) => {
                const status = statuses.get(announcement.id) ?? "expired";
                return (
                  <tr key={announcement.id}>
                    <td className="font-semibold">
                      <Link href={`/admin/announcements/${announcement.id}`}>{preview(announcement.message)}</Link>
                    </td>
                    <td data-label="Link" className="max-w-xs break-all">{announcement.linkUrl ?? "—"}</td>
                    <td data-label="Starts" className="whitespace-nowrap">{formatAdminDateTime(announcement.startsAt)}</td>
                    <td data-label="Ends" className="whitespace-nowrap">{formatAdminDateTime(announcement.endsAt)}</td>
                    <td>
                      <span className={statusClass[status]}>{announcementStatusLabels[status]}</span>
                      {status === "hidden" ? (
                        <p className="mt-1 max-w-40 text-xs text-asphalt/70">
                          A newer live announcement is showing instead.
                        </p>
                      ) : null}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <Link href={`/admin/announcements/${announcement.id}`}>Edit</Link>
                        <ConfirmForm
                          action={deleteAnnouncement}
                          message={`Delete “${preview(announcement.message)}”? This cannot be undone.`}
                        >
                          <input type="hidden" name="id" value={announcement.id} />
                          <ActionButton className="danger" pendingLabel="Deleting…">
                            Delete
                          </ActionButton>
                        </ConfirmForm>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
