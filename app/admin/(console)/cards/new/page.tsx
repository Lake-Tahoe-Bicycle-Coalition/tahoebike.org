import Link from "next/link";
import { HomepageCardForm } from "@/components/admin/homepage-card-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { blobConfigured } from "@/lib/admin/blob";
import { createHomepageCard } from "@/lib/admin/cards/actions";
import { emptyHomepageCardFormValues } from "@/lib/admin/cards/fields";

export default async function NewHomepageCardPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New card"
        description="New cards go to the bottom of the list; use “Move up” on the Homepage cards page to place them."
        action={
          <Link href="/admin/cards" className="btn btn-secondary">
            Cancel
          </Link>
        }
      />
      <HomepageCardForm
        action={createHomepageCard}
        defaults={emptyHomepageCardFormValues}
        submitLabel="Add card"
        uploadEnabled={blobConfigured}
      />
    </div>
  );
}
