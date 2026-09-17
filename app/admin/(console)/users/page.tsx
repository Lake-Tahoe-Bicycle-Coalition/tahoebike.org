import { AdminUserForm } from "@/components/admin/admin-user-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { formatAdminDateTime } from "@/lib/admin/datetime";
import { addAdminUser, removeAdminUser } from "@/lib/admin/users/actions";
import { isPlaceholderAdmin } from "@/lib/admin/users/fields";
import { prisma } from "@/lib/db";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const me = await requireAdmin();
  const { notice } = await searchParams;

  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  const hasPlaceholders = admins.some((admin) => isPlaceholderAdmin(admin.email));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admins"
        description="Only these Google accounts can sign in here. Use the address the person signs in to Google with. Changes apply the next time someone signs in."
      />
      <Notice notice={notice} />

      {hasPlaceholders ? (
        <p className="rounded border border-safety bg-safety/20 px-4 py-3 text-sm">
          The rows marked <span className="badge badge-warn">placeholder</span> came with the initial setup and
          cannot sign in. Add the real board accounts, then remove the placeholders before launch.
        </p>
      ) : null}

      {admins.length === 0 ? (
        <p>No admins yet. Add the first one below.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Name</th>
                <th scope="col">Added</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const isMe = admin.email === me.email;
                return (
                  <tr key={admin.id}>
                    <td className="font-semibold">
                      {admin.email}
                      {isMe ? <span className="ml-2 font-normal text-asphalt/70">(you)</span> : null}
                      {isPlaceholderAdmin(admin.email) ? (
                        <span className="badge badge-warn ml-2">placeholder</span>
                      ) : null}
                    </td>
                    <td>{admin.name ?? "—"}</td>
                    <td className="whitespace-nowrap">{formatAdminDateTime(admin.createdAt)}</td>
                    <td>
                      <div className="admin-actions">
                        {isMe || admins.length <= 1 ? (
                          <span className="text-sm text-asphalt/60">
                            {isMe ? "Cannot remove yourself" : "Last admin"}
                          </span>
                        ) : (
                          <ConfirmForm
                            action={removeAdminUser}
                            message={`Remove ${admin.email}? They will not be able to sign in to the admin console.`}
                          >
                            <input type="hidden" name="id" value={admin.id} />
                            <button type="submit" className="danger">
                              Remove
                            </button>
                          </ConfirmForm>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="border-t border-asphalt/15 pt-6">
        <h2 className="text-lg sm:text-lg">Add an admin</h2>
        <p className="mt-1 mb-4 text-sm text-asphalt/80">
          They get the same access as everyone else here. There are no roles.
        </p>
        <AdminUserForm action={addAdminUser} />
      </section>
    </div>
  );
}
