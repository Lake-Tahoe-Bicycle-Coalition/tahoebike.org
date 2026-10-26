import Link from "next/link";
import { NewsletterForm } from "@/components/forms/newsletter-form";

type Props = {
  /** Optional id for the wrapper, so other pages can link to the form (e.g. /join#newsletter). */
  id?: string;
  heading?: string;
  /** When set, the intro ends with a "Read past newsletters here" link to this path. */
  archiveHref?: string;
};

/**
 * Newsletter signup panel. The form subscribes the visitor through Constant Contact's
 * API, or sends them to Constant Contact's hosted opt-in page when that is not
 * available (see subscribeNewsletter in lib/forms/actions.ts).
 */
export function NewsletterSignupForm({ id, heading = "Newsletter", archiveHref }: Props) {
  const headingId = `${id ?? "newsletter-signup"}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="rounded-lg border border-asphalt/10 bg-neutral-100 p-6 text-asphalt sm:p-8"
    >
      <h2 id={headingId}>{heading}</h2>
      <p className="mt-3">
        Subscribe to our newsletter to stay up to date on the latest biking news and volunteer
        opportunities!
        {archiveHref ? (
          <>
            {" "}
            <Link href={archiveHref} className="font-semibold">
              Read past newsletters here
            </Link>
            .
          </>
        ) : null}
      </p>
      <NewsletterForm />
    </section>
  );
}
