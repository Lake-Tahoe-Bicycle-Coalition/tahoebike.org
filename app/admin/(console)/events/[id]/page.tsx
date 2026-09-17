import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { EventForm } from "@/components/admin/event-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteEvent, updateEvent } from "@/lib/admin/events/actions";
import { eventToFormValues } from "@/lib/admin/events/schema";
import { prisma } from "@/lib/db";

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit event"
        description={event.title}
        action={
          <Link href="/admin/events" className="btn btn-secondary">
            Back to events
          </Link>
        }
      />
      <EventForm action={updateEvent.bind(null, event.id)} defaults={eventToFormValues(event)} submitLabel="Save event" />

      <section className="border-t border-asphalt/15 pt-6">
        <h2 className="text-lg sm:text-lg">Delete this event</h2>
        <p className="mt-1 text-sm text-asphalt/80">Removes it from the site immediately. This cannot be undone.</p>
        <ConfirmForm
          action={deleteEvent}
          message={`Delete “${event.title}”? This cannot be undone.`}
          className="mt-3"
        >
          <input type="hidden" name="id" value={event.id} />
          <button type="submit" className="btn btn-secondary border-red-700 text-red-700 hover:bg-red-700 hover:text-white">
            Delete event
          </button>
        </ConfirmForm>
      </section>
    </div>
  );
}
