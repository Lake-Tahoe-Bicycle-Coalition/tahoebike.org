import type { NewsletterItem } from "@/lib/constant-contact";

type Props = {
  /** Archived campaigns, newest first (from fetchNewsletterArchive). */
  items: NewsletterItem[];
  /** Hosted opt-in URL shown when there is nothing to list. */
  signupUrl: string;
  heading?: string;
};

/**
 * Lists recent newsletters from the Constant Contact archive: the newest issue
 * prominently, the rest as a list. Falls back to a subscribe link when the archive is
 * empty or unreachable.
 */
export function NewsletterArchive({ items, signupUrl, heading = "Newsletters" }: Props) {
  const [latest, ...past] = items;

  return (
    <section aria-labelledby="newsletter-archive-heading">
      <h2 id="newsletter-archive-heading">{heading}</h2>

      {latest ? (
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-base">Latest newsletter</h3>
            <p className="mt-2 text-xl font-bold">
              <ArchiveLink item={latest} />
            </p>
          </div>

          {past.length > 0 ? (
            <div>
              <h3 className="text-base">Past issues</h3>
              <ul className="mt-2 divide-y divide-asphalt/10 border-y border-asphalt/10">
                {past.map((item) => (
                  <li key={item.campaignUrl} className="py-2">
                    <ArchiveLink item={item} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-4">
          <a href={signupUrl} target="_blank" rel="noopener">
            Subscribe to get our latest news by email.
          </a>
        </p>
      )}
    </section>
  );
}

function ArchiveLink({ item }: { item: NewsletterItem }) {
  return (
    <a href={item.campaignUrl} target="_blank" rel="noopener">
      {item.subject}
      {item.sentDate ? <span className="ml-2 text-sm font-normal text-asphalt/70">{item.sentDate}</span> : null}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
