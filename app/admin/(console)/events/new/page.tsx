import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { createEvent } from "@/lib/admin/events/actions";
import { emptyEventFormValues, type EventFormValues } from "@/lib/admin/events/fields";
import { eventToFormValues } from "@/lib/admin/events/schema";
import { prisma } from "@/lib/db";

/** `?from=<id>` prefills the form from an existing event (monthly fix-ups repeat). */
export default async function NewEventPage({ searchParams }: PageProps<"/admin/events/new">) {
  await requireAdmin();
  const { from } = await searchParams;

  let defaults: EventFormValues = emptyEventFormValues;
  if (typeof from === "string" && from) {
    const source = await prisma.event.findUnique({ where: { id: from } });
    if (source) defaults = eventToFormValues(source);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New event"
        action={
          <Link href="/admin/events" className="btn btn-secondary">
            Cancel
          </Link>
        }
      />
      <EventForm action={createEvent} defaults={defaults} submitLabel="Add event" />
    </div>
  );
}
