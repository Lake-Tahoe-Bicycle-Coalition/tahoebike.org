export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body. */
  text: string;
  replyTo?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
