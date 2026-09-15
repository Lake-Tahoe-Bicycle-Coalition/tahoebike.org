import type { EmailMessage, EmailProvider } from "./types";

/** Development fallback: prints the message instead of sending it. */
export class ConsoleProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.info(
      [
        "[email] Not sent (RESEND_API_KEY is not set). Message:",
        `To: ${message.to}`,
        `Reply-To: ${message.replyTo ?? "(none)"}`,
        `Subject: ${message.subject}`,
        "",
        message.text,
      ].join("\n"),
    );
  }
}
