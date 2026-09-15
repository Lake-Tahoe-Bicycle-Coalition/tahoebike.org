import { ConsoleProvider } from "./console";
import { ResendProvider } from "./resend";
import type { EmailProvider } from "./types";

export type { EmailMessage, EmailProvider } from "./types";

export const DEFAULT_EMAIL_FROM = "Lake Tahoe Bicycle Coalition <no-reply@tahoebike.org>";

/**
 * Resend when RESEND_API_KEY is set; otherwise messages are logged to the console.
 * Swap providers here (or add one implementing EmailProvider) without touching callers.
 */
export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    return new ResendProvider(apiKey, process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM);
  }
  return new ConsoleProvider();
}
