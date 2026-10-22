/**
 * `true` on the Vercel production deployment only (not previews, `next dev`, or a local
 * `next start`). Integrations that no-op when unconfigured use this to fail loudly in
 * production instead, where a missing key means lost messages or unverified spam.
 */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}
