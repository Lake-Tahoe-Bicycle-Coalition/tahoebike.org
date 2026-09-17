import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { PageHeader } from "@/components/admin/page-header";
import { deleteAnnouncement, updateAnnouncement } from "@/lib/admin/announcements/actions";
import { announcementToFormValues } from "@/lib/admin/announcements/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

export default async function EditAnnouncementPage({ params }: PageProps<"/admin/announcements/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit announcement"
        action={
          <Link href="/admin/announcements" className="btn btn-secondary">
            Back to announcements
          </Link>
        }
      />
      <AnnouncementForm
        action={updateAnnouncement.bind(null, announcement.id)}
        defaults={announcementToFormValues(announcement)}
        submitLabel="Save announcement"
      />

      <section className="border-t border-asphalt/15 pt-6">
        <h2 className="text-lg sm:text-lg">Delete this announcement</h2>
        <p className="mt-1 text-sm text-asphalt/80">
          Removes the banner from the site immediately if it is showing. This cannot be undone.
        </p>
        <ConfirmForm action={deleteAnnouncement} message="Delete this announcement? This cannot be undone." className="mt-3">
          <input type="hidden" name="id" value={announcement.id} />
          <button type="submit" className="btn btn-secondary border-red-700 text-red-700 hover:bg-red-700 hover:text-white">
            Delete announcement
          </button>
        </ConfirmForm>
      </section>
    </div>
  );
}
