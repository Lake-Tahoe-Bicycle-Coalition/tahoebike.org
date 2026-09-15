import type { EmailMessage, EmailProvider } from "./types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** A hung Resend request must not hold a form submission (already stored) hostage. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Sends through Resend's REST API (https://resend.com/docs/api-reference/emails/send-email). */
export class ResendProvider implements EmailProvider {
  private readonly apiKey: string;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Resend responded ${response.status}: ${await response.text()}`);
    }
  }
}
