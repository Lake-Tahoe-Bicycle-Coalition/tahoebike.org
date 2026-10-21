import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { SmartLink } from "@/components/smart-link";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Join the Coalition",
  description:
    "Join us and help us promote safe and enjoyable bicycle transportation and recreation in the Tahoe basin: become a member, donate, volunteer, or subscribe to our newsletter.",
  alternates: { canonical: "/join" },
};

function mailtoLink(email: string, subject: string, body: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default async function JoinPage() {
  const settings = await getSettings();

  const tiers = [
    {
      name: "Individual",
      price: settings.membership_price_individual,
      url: settings.memberful_individual_url,
    },
    { name: "Family", price: settings.membership_price_family, url: settings.memberful_family_url },
    {
      name: "Business",
      price: settings.membership_price_business,
      url: settings.memberful_business_url,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1>Join the Coalition</h1>

      <section aria-labelledby="membership-heading" className="mt-10">
        <h2 id="membership-heading">Membership Overview</h2>
        <div className="prose-ltbc mt-4 max-w-3xl">
          <p>
            Join us and help us promote safe and enjoyable bicycle transportation and recreation;
            and to use bicycling as an immediate and practical way to help build a healthy and
            sustainable community.
          </p>
          <p>
            With your energy, experience and membership dues, we can work together to promote
            cycling in the Tahoe basin and continue to invest in our ever expanding network of
            cycling paths and infrastructure.
          </p>
        </div>
        <ul className="mt-8 grid gap-6 sm:grid-cols-3">
          {tiers.map((tier) => (
            <li
              key={tier.name}
              className="flex flex-col rounded-lg border-2 border-asphalt/10 p-6"
            >
              <h3>{tier.name}</h3>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="font-heading text-4xl font-extrabold">${tier.price}</span>
                <span className="text-sm">per year</span>
              </p>
              <p className="mt-auto pt-5">
                <SmartLink href={tier.url} className="btn btn-primary">
                  Join
                  <span className="sr-only"> as {tier.name}</span>
                </SmartLink>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="donate" aria-labelledby="donate-heading" className="mt-16">
        <h2 id="donate-heading">Donate</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <DonationPanel
            id="one-time-donation"
            title="One-Time Donation"
            checkoutUrl={settings.memberful_checkout_url}
            plan={settings.memberful_one_time_donation_plan}
          />
          <DonationPanel
            id="recurring-donation"
            title="Recurring Donation"
            checkoutUrl={settings.memberful_checkout_url}
            plan={settings.memberful_recurring_donation_plan}
          />
        </div>
      </section>

      <section aria-labelledby="involved-heading" className="mt-16">
        <h2 id="involved-heading">Other Ways to Get Involved</h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-3">
          <li className="flex flex-col gap-3 rounded-lg border border-asphalt/10 p-6">
            <h3>Volunteer</h3>
            <p>
              There are numerous opportunities to volunteer. This is a great way to show your
              support, get involved, and meet fun people.
            </p>
            <p className="flex-1">
              You can also{" "}
              <SmartLink href={settings.constant_contact_volunteer_url}>
                join our volunteer email list
              </SmartLink>
              .
            </p>
            <p>
              <Link href="/volunteer" className="btn btn-primary">
                Sign up
              </Link>
            </p>
          </li>
          <li className="flex flex-col gap-3 rounded-lg border border-asphalt/10 p-6">
            <h3>Get Email Updates</h3>
            <p className="flex-1">
              Sign up now for free email updates and our monthly newsletter – to get all the
              latest bike news for the region!
            </p>
            <p>
              <a href="#newsletter" className="btn btn-primary">
                Subscribe
              </a>
            </p>
          </li>
          <li className="flex flex-col gap-3 rounded-lg border border-asphalt/10 p-6">
            <h3>Join Our Board</h3>
            <p className="flex-1">
              Is our mission important to you? Would you be interested in joining our board? Let’s
              Connect!
            </p>
            <p>
              <a href={mailtoLink(
                  settings.contact_email,
                  "Joining the LTBC board",
                  "Hi LTBC,\n\nI'm interested in joining the board. A little about me:\n\n",
                )}
                className="btn btn-primary"
              >
                Email us
              </a>
            </p>
          </li>
        </ul>
      </section>

      <div className="mt-16 max-w-3xl">
        <NewsletterSignupForm
          id="newsletter"
          signupUrl={settings.constant_contact_signup_url}
          archiveHref="/newsletter"
        />
      </div>
    </div>
  );
}

/**
 * A donation option: a "choose what you pay" form, which sends `plan` and `price` to Memberful checkout.
 */
function DonationPanel({
  id,
  title,
  checkoutUrl,
  plan,
}: {
  id: string;
  title: string;
  checkoutUrl: string;
  plan: string;
}) {
  const priceId = `${id}-price`;
  return (
    <section aria-labelledby={`${id}-heading`} className="rounded-lg border border-asphalt/10 bg-neutral-100 p-6">
      <h3 id={`${id}-heading`}>{title}</h3>
      <form action={checkoutUrl} method="get" className="mt-4">
        <input type="hidden" name="plan" value={plan} />
        <label htmlFor={priceId} className="field-label">
          Amount in USD
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={priceId}
            type="number"
            name="price"
            min="1"
            step="0.01"
            inputMode="decimal"
            placeholder="Choose what you pay"
            required
            className="field-input sm:max-w-xs"
          />
          <button type="submit" className="btn btn-primary shrink-0">
            Donate
          </button>
        </div>
      </form>
    </section>
  );
}
