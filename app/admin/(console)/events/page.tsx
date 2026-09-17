import Link from "next/link";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { formatAdminDateTime } from "@/lib/admin/datetime";
import { deleteEvent } from "@/lib/admin/events/actions";
import { programLabels } from "@/lib/admin/events/fields";
import { prisma } from "@/lib/db";

export default async function EventsPage({ searchParams }: PageProps<"/admin/events">) {
  await requireAdmin();
  const { notice, past } = await searchParams;
  const showPast = past === "1";
  const now = new Date();

  const events = await prisma.event.findMany({
    where: showPast ? { endsAt: { lt: now } } : { endsAt: { gte: now } },
    orderBy: { startsAt: showPast ? "desc" : "asc" },
    take: showPast ? 100 : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Upcoming events show on the Bike Kitchen page and drop off automatically once they end. Times are Pacific."
        action={
          <Link href="/admin/events/new" className="btn btn-primary">
            New event
          </Link>
        }
      />
      <Notice notice={notice} />

      <p className="flex gap-4 text-sm font-semibold">
        {showPast ? (
          <>
            <Link href="/admin/events">Upcoming</Link>
            <span aria-current="page">Past (latest 100)</span>
          </>
        ) : (
          <>
            <span aria-current="page">Upcoming</span>
            <Link href="/admin/events?past=1">Past</Link>
          </>
        )}
      </p>

      {events.length === 0 ? (
        <p>{showPast ? "No past events." : "No upcoming events. Add one to show it on the site."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Program</th>
                <th scope="col">Starts</th>
                <th scope="col">Ends</th>
                <th scope="col">Location</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="font-semibold">
                    <Link href={`/admin/events/${event.id}`}>{event.title}</Link>
                  </td>
                  <td>{programLabels[event.program]}</td>
                  <td className="whitespace-nowrap">{formatAdminDateTime(event.startsAt)}</td>
                  <td className="whitespace-nowrap">{formatAdminDateTime(event.endsAt)}</td>
                  <td>{event.locationName ?? event.address ?? "—"}</td>
                  <td>
                    <div className="admin-actions">
                      <Link href={`/admin/events/${event.id}`}>Edit</Link>
                      <Link href={`/admin/events/new?from=${event.id}`}>Duplicate</Link>
                      <ConfirmForm action={deleteEvent} message={`Delete “${event.title}”? This cannot be undone.`}>
                        <input type="hidden" name="id" value={event.id} />
                        <button type="submit" className="danger">
                          Delete
                        </button>
                      </ConfirmForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
