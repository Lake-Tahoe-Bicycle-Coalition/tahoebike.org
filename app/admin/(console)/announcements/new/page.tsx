import Link from "next/link";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { PageHeader } from "@/components/admin/page-header";
import { createAnnouncement } from "@/lib/admin/announcements/actions";
import { emptyAnnouncementFormValues } from "@/lib/admin/announcements/fields";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewAnnouncementPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New announcement"
        action={
          <Link href="/admin/announcements" className="btn btn-secondary">
            Cancel
          </Link>
        }
      />
      <AnnouncementForm
        action={createAnnouncement}
        defaults={emptyAnnouncementFormValues}
        submitLabel="Add announcement"
      />
    </div>
  );
}
