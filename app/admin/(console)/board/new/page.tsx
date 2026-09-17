import Link from "next/link";
import { BoardMemberForm } from "@/components/admin/board-member-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { blobConfigured } from "@/lib/admin/blob";
import { createBoardMember } from "@/lib/admin/board/actions";
import { emptyBoardMemberFormValues } from "@/lib/admin/board/fields";

export default async function NewBoardMemberPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New board member"
        description="New people go to the bottom of the list; use “Move up” on the Board page to place them."
        action={
          <Link href="/admin/board" className="btn btn-secondary">
            Cancel
          </Link>
        }
      />
      <BoardMemberForm
        action={createBoardMember}
        defaults={emptyBoardMemberFormValues}
        submitLabel="Add board member"
        uploadEnabled={blobConfigured}
      />
    </div>
  );
}
