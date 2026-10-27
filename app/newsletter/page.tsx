import { NewsletterArchive } from "@/components/newsletter-archive";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { fetchNewsletterArchive } from "@/lib/constant-contact";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "Newsletter",
  description:
    "Subscribe to the Lake Tahoe Bicycle Coalition newsletter for Tahoe biking news, events and volunteer opportunities, or browse past issues.",
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
        <h1>Stay Informed</h1>
        <p className="mt-6 text-lg">
          Our newsletter brings you Tahoe biking news, events and volunteer opportunities, about
          once a month.
        </p>
      </header>

      <div className="mt-10 max-w-3xl">
        <NewsletterSignupForm heading="Sign up" mode="full" defaultLists={["general"]} />
      </div>

      <div className="mt-16 max-w-3xl">
        <NewsletterArchive
          heading="Past issues"
          intro="Not sure what to expect? Browse recent issues."
          items={newsletters}
          signupUrl={settings.constant_contact_signup_url}
        />
      </div>
    </div>
  );
}
