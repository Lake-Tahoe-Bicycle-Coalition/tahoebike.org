import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";

/**
 * Admin sign-in: Google OAuth, restricted to emails in the AdminUser table.
 * Sessions are stateless JWTs, so no auth tables are needed in the database.
 * `requireAdmin()` in lib/admin.ts re-checks the allowlist on every request.
 */
export const authConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && process.env.AUTH_SECRET,
);

export async function isAllowedAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return admin !== null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/sign-in", error: "/admin/sign-in" },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google's OIDC profile says whether it has verified the address. Refuse
      // unverified ones so that an allowlisted email cannot be claimed by an account
      // that merely asserts it.
      if (account?.provider === "google" && profile?.email_verified !== true) return false;
      return isAllowedAdmin(user.email);
    },
  },
});
