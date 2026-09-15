import { signupFormTarget } from "@/lib/constant-contact";

type Props = {
  /** The hosted Constant Contact opt-in URL (settings.constant_contact_signup_url). */
  signupUrl: string;
  /** Optional id for the wrapper, so other pages can link to the form (e.g. /join#newsletter). */
  id?: string;
};

/**
 * Newsletter signup panel. A plain GET form that works without JavaScript: the browser
 * sends the visitor to Constant Contact's hosted opt-in page, which completes the signup.
 */
export function NewsletterSignupForm({ signupUrl, id }: Props) {
  const { action, hiddenFields } = signupFormTarget(signupUrl);
  const headingId = `${id ?? "newsletter-signup"}-heading`;
  const emailId = `${id ?? "newsletter-signup"}-email`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="rounded-lg bg-safety p-6 text-asphalt sm:p-8"
    >
      <h2 id={headingId}>Newsletter</h2>
      <p className="mt-3">
        Subscribe to our newsletter to stay up to date on the latest biking news and volunteer
        opportunities!
      </p>
      <form action={action} method="get" className="mt-5">
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label htmlFor={emailId} className="field-label">
          Email address
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={emailId}
            type="email"
            name="email"
            autoComplete="email"
            required
            className="field-input border-asphalt/60"
          />
          <button
            type="submit"
            className="btn btn-primary shrink-0 border-asphalt hover:bg-asphalt hover:text-white"
          >
            Subscribe
          </button>
        </div>
      </form>
    </section>
  );
}
