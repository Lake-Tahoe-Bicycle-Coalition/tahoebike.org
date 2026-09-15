import { requireAdmin } from "@/lib/admin";
import { signOut } from "@/lib/auth";

export default async function AdminHome() {
  const admin = await requireAdmin();

  return (
    <div className="space-y-6">
      <h1>Admin</h1>
      <p>
        Signed in as <strong>{admin.name ?? admin.email}</strong> ({admin.email}).
      </p>
      <p>
        The admin interface (events, board, homepage cards, announcements, settings, and the
        submissions inbox) is built in Phase 3.
      </p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" className="btn btn-secondary">
          Sign out
        </button>
      </form>
    </div>
  );
}
