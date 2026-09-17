import { cache } from "react";
import { redirect } from "next/navigation";
import { auth, isAllowedAdmin } from "@/lib/auth";

export type AdminIdentity = { email: string; name: string | null };

/**
 * Local development only: `ADMIN_DEV_EMAIL=you@example.com` in .env signs that address
 * in without Google, so /admin can be exercised before OAuth is configured. `next dev`
 * is the only command that sets NODE_ENV to "development"; builds, `next start`, and
 * every Vercel deployment (previews included) run as "production" and ignore it.
 */
function devBypass(): AdminIdentity | null {
  if (process.env.NODE_ENV !== "development") return null;
  const email = process.env.ADMIN_DEV_EMAIL?.trim().toLowerCase();
  return email ? { email, name: "Local developer" } : null;
}

/**
 * The signed-in admin, or null. Use it where a redirect is the wrong response
 * (route handlers). Pages and server actions should call requireAdmin() instead.
 */
export const getAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const bypass = devBypass();
  if (bypass) return bypass;

  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email || !(await isAllowedAdmin(email))) return null;
  return { email, name: session?.user?.name ?? null };
});

/**
 * Data-access-layer guard for everything under /admin.
 * Call it at the top of every admin page and server action; layouts are not a
 * security boundary in the App Router.
 */
export const requireAdmin = cache(async (): Promise<AdminIdentity> => {
  const admin = await getAdmin();
  if (admin) return admin;

  const session = await auth();
  redirect(session?.user?.email ? "/admin/sign-in?error=AccessDenied" : "/admin/sign-in");
});
