import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";
import { authConfigured, signIn } from "@/lib/auth";

const errorMessages: Record<string, string> = {
  AccessDenied: "That Google account is not on the admin list.",
  Configuration: "Sign-in is not configured on this deployment.",
};

export default async function SignInPage({ searchParams }: PageProps<"/admin/sign-in">) {
  if (await getAdmin()) redirect("/admin");

  const { error } = await searchParams;
  const errorKey = typeof error === "string" ? error : undefined;
  const message = errorKey ? (errorMessages[errorKey] ?? "Sign-in failed. Please try again.") : null;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1>Admin sign-in</h1>
      <p>Board members sign in with the Google account listed on the admin allowlist.</p>
      {message ? (
        <p role="alert" className="rounded border border-red-700 bg-red-50 px-4 py-3 text-red-900">
          {message}
        </p>
      ) : null}
      {authConfigured ? (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/admin" });
          }}
        >
          <button type="submit" className="btn btn-primary">
            Sign in with Google
          </button>
        </form>
      ) : (
        <p className="rounded border border-asphalt/20 bg-neutral-50 px-4 py-3">
          Google sign-in is not configured. Set <code>AUTH_GOOGLE_ID</code>,{" "}
          <code>AUTH_GOOGLE_SECRET</code>, and <code>AUTH_SECRET</code> (see{" "}
          <code>.env.example</code>). For local development, <code>ADMIN_DEV_EMAIL</code> signs you in
          without Google.
        </p>
      )}
    </div>
  );
}
