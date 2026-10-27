import Link from "next/link";
import type { ReactNode } from "react";
import { NewsletterForm, type NewsletterFormMode } from "@/components/forms/newsletter-form";
import type { SignupListKey } from "@/lib/constant-contact-lists";

type Props = {
  /** Optional id for the wrapper, so other pages can link to the form (e.g. /join#newsletter). */
  id?: string;
  heading?: string;
  /** When set, the intro ends with a "Read past newsletters here" link to this path. */
  archiveHref?: string;
  /** Replaces the default intro paragraph (and its archive link). */
  intro?: ReactNode;
  /**
   * "compact" (default): email and Subscribe, then optional name and lists. "full":
   * email, name and every list up front. See components/forms/newsletter-form.tsx.
   */
  mode?: NewsletterFormMode;
  /** Full mode: lists ticked to begin with. */
  defaultLists?: readonly SignupListKey[];
  /** Full mode: General Info ticked and disabled, so every signup gets the newsletter. */
  generalLocked?: boolean;
};

/**
 * Newsletter signup panel. The form subscribes the visitor to the Constant Contact lists
 * they choose through the API, or sends them to Constant Contact's hosted opt-in page
 * when that is not available (see subscribeNewsletter in lib/forms/actions.ts).
 */
export function NewsletterSignupForm({
  id,
  heading = "Newsletter",
  archiveHref,
  intro,
  mode = "compact",
  defaultLists,
  generalLocked,
}: Props) {
  const headingId = `${id ?? "newsletter-signup"}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="rounded-lg border border-asphalt/10 bg-neutral-100 p-6 text-asphalt sm:p-8"
    >
      <h2 id={headingId}>{heading}</h2>
      <p className="mt-3">
        {intro ?? (
          <>
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
          </>
        )}
      </p>
      <NewsletterForm mode={mode} defaultLists={defaultLists} generalLocked={generalLocked} />
    </section>
  );
}
