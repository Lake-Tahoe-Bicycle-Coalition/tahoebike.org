import { isProductionDeployment } from "@/lib/deployment";
import { ConsoleProvider } from "./console";
import { ResendProvider } from "./resend";
import type { EmailProvider } from "./types";

export type { EmailMessage, EmailProvider } from "./types";

export const DEFAULT_EMAIL_FROM = "Lake Tahoe Bicycle Coalition <no-reply@tahoebike.org>";

/** Production without a key: every send fails, so callers log it as a failed notification. */
class MissingKeyProvider implements EmailProvider {
  async send(): Promise<void> {
    throw new Error("RESEND_API_KEY is not set on the production deployment; notification not sent.");
  }
}

/**
 * Resend when RESEND_API_KEY is set. Without it, messages are logged to the console
 * (development and previews) or fail with an error (the production deployment, where a
 * console log would mean nobody hears about a new submission).
 * Swap providers here (or add one implementing EmailProvider) without touching callers.
 */
export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    return new ResendProvider(apiKey, process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM);
  }
  return isProductionDeployment() ? new MissingKeyProvider() : new ConsoleProvider();
}
