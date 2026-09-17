import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardMemberForm } from "@/components/admin/board-member-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { blobConfigured } from "@/lib/admin/blob";
import { deleteBoardMember, updateBoardMember } from "@/lib/admin/board/actions";
import { boardMemberToFormValues } from "@/lib/admin/board/schema";
import { prisma } from "@/lib/db";

export default async function EditBoardMemberPage({ params }: PageProps<"/admin/board/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const member = await prisma.boardMember.findUnique({ where: { id } });
  if (!member) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit board member"
        description={member.name}
        action={
          <Link href="/admin/board" className="btn btn-secondary">
            Back to board
          </Link>
        }
      />
      <BoardMemberForm
        action={updateBoardMember.bind(null, member.id)}
        defaults={boardMemberToFormValues(member)}
        submitLabel="Save board member"
        uploadEnabled={blobConfigured}
      />

      <section className="border-t border-asphalt/15 pt-6">
        <h2 className="text-lg sm:text-lg">Delete this board member</h2>
        <p className="mt-1 text-sm text-asphalt/80">
          Removes them from the site immediately, along with any uploaded photo. This cannot be undone. To hide
          someone temporarily, untick “Active” instead.
        </p>
        <ConfirmForm
          action={deleteBoardMember}
          message={`Delete “${member.name}”? This cannot be undone.`}
          className="mt-3"
        >
          <input type="hidden" name="id" value={member.id} />
          <button type="submit" className="btn btn-secondary border-red-700 text-red-700 hover:bg-red-700 hover:text-white">
            Delete board member
          </button>
        </ConfirmForm>
      </section>
    </div>
  );
}
