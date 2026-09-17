import type { ReactNode } from "react";
import { AdminNav, type AdminNavItem } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/admin/auth";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Chrome for every admin page except sign-in: section nav, who is signed in, sign out.
 * The auth check here is a convenience (unauthenticated visitors bounce before any page
 * renders); every page and action still calls requireAdmin() itself.
 */
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  let newSubmissions = 0;
  try {
    newSubmissions = await prisma.formSubmission.count({ where: { status: "NEW" } });
  } catch (error) {
    console.error("Could not count new submissions.", error);
  }

  const items: AdminNavItem[] = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/board", label: "Board" },
    { href: "/admin/cards", label: "Homepage cards" },
    { href: "/admin/announcements", label: "Announcements" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/submissions", label: "Submissions", badge: newSubmissions },
    { href: "/admin/users", label: "Admins" },
  ];

  return (
    <div className="space-y-8">
      <AdminNav
        items={items}
        account={
          <>
            <span className="text-asphalt/70">{admin.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="font-semibold text-tahoe-deep underline">
                Sign out
              </button>
            </form>
          </>
        }
      />
      {children}
    </div>
  );
}
