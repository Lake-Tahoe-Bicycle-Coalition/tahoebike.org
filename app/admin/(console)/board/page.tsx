import Image from "next/image";
import Link from "next/link";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteBoardMember, moveBoardMember, toggleBoardMemberActive } from "@/lib/admin/board/actions";
import { initials } from "@/lib/initials";
import { prisma } from "@/lib/db";
import { isOptimizableImageUrl } from "@/lib/urls";

/** Same fallback the public roster shows when a member has no photo. */

export default async function BoardPage({ searchParams }: PageProps<"/admin/board">) {
  await requireAdmin();
  const { notice } = await searchParams;

  const members = await prisma.boardMember.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Board"
        description="The About page lists board members in this order, then advisors by name. Inactive people stay here but are hidden from the site."
        action={
          <Link href="/admin/board/new" className="btn btn-primary">
            New board member
          </Link>
        }
      />
      <Notice notice={notice} />

      {members.length === 0 ? (
        <p>No board members yet. Add one to show the roster on the About page.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Photo</span>
                </th>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => (
                <tr key={member.id} className={member.isActive ? undefined : "opacity-60"}>
                  <td className="w-14">
                    <div className="relative h-10 w-10 overflow-hidden rounded bg-bluebird/30">
                      {member.photoUrl ? (
                        <Image
                          src={member.photoUrl}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized={!isOptimizableImageUrl(member.photoUrl)}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-full w-full items-center justify-center text-sm font-extrabold text-tahoe-deep"
                        >
                          {initials(member.name)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-semibold">
                    <Link href={`/admin/board/${member.id}`}>{member.name}</Link>
                    {member.isAdvisor ? <span className="badge ml-2">Advisor</span> : null}
                  </td>
                  <td>{member.role}</td>
                  <td>
                    <span className={member.isActive ? "badge badge-active" : "badge"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Link href={`/admin/board/${member.id}`}>Edit</Link>
                      <form action={moveBoardMember}>
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={index === 0}
                          className="disabled:opacity-40"
                          aria-label={`Move ${member.name} up`}
                        >
                          Move up
                        </button>
                      </form>
                      <form action={moveBoardMember}>
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={index === members.length - 1}
                          className="disabled:opacity-40"
                          aria-label={`Move ${member.name} down`}
                        >
                          Move down
                        </button>
                      </form>
                      <form action={toggleBoardMemberActive}>
                        <input type="hidden" name="id" value={member.id} />
                        <button type="submit">{member.isActive ? "Deactivate" : "Activate"}</button>
                      </form>
                      <ConfirmForm
                        action={deleteBoardMember}
                        message={`Delete “${member.name}”? This cannot be undone.`}
                      >
                        <input type="hidden" name="id" value={member.id} />
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
