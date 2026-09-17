import { NewsletterArchive } from "@/components/newsletter-archive";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { fetchNewsletterArchive } from "@/lib/constant-contact";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "Newsletter",
  description:
    "Read past Lake Tahoe Bicycle Coalition newsletters and subscribe to stay updated on all things cycling in Tahoe.",
  path: "/newsletter",
});

/** More than the archive currently holds; the list simply shows everything available. */
const ARCHIVE_LIMIT = 12;

export default async function NewsletterPage() {
  const settings = await getSettings();
  const newsletters = await fetchNewsletterArchive(settings.constant_contact_account_id, ARCHIVE_LIMIT);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="max-w-3xl">
        <p className="font-heading font-extrabold uppercase tracking-[0.1em]">
          Discover Our Newsletter Archive
        </p>
        <h1 className="mt-2">Stay Informed with the Lake Tahoe Bicycle Coalition</h1>
        <p className="mt-6 text-lg">
          Explore our collection of past newsletters and stay updated on all things cycling in
          Tahoe.
        </p>
      </header>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:max-w-3xl">
        <section aria-labelledby="newsletter-highlights-heading">
          <h2 id="newsletter-highlights-heading" className="text-lg">
            Newsletter Highlights
          </h2>
          <p className="mt-2">Catch up on the latest cycling news and events in Lake Tahoe.</p>
        </section>
        <section aria-labelledby="newsletter-community-heading">
          <h2 id="newsletter-community-heading" className="text-lg">
            Join the Community
          </h2>
          <p className="mt-2">Be part of our mission to make Tahoe more bicycle-friendly.</p>
        </section>
      </div>

      <div className="mt-16 max-w-3xl">
        <NewsletterArchive
          heading="Past Newsletters"
          items={newsletters}
          signupUrl={settings.constant_contact_signup_url}
        />
      </div>

      <div className="mt-16">
        <NewsletterSignupForm heading="Sign up!" signupUrl={settings.constant_contact_signup_url} />
      </div>
    </div>
  );
}
