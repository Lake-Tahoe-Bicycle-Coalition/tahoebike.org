import { cache } from "react";
import { redirect } from "next/navigation";
import { auth, isAllowedAdmin } from "@/lib/auth";

/**
 * Data-access-layer guard for everything under /admin.
 * Call it at the top of every admin page and server action.
 */
export const requireAdmin = cache(async () => {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/admin/sign-in");
  if (!(await isAllowedAdmin(email))) redirect("/admin/sign-in?error=AccessDenied");
  return { email, name: session?.user?.name ?? null };
});
