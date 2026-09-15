import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Send the Lake Tahoe Bicycle Coalition a message, or reach us by email, mail, Facebook, or Instagram.",
};

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1>Contact Us</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="contact-form-heading">
          <h2 id="contact-form-heading">Send us a Message</h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </section>

        <aside
          aria-labelledby="contact-other-heading"
          className="h-fit rounded-lg bg-tahoe/10 p-6 sm:p-8"
        >
          <h2 id="contact-other-heading" className="text-xl">
            Other Ways to Reach Us
          </h2>
          <ul className="mt-4 space-y-3">
            <li>
              <ExternalLink href={settings.facebook_url}>Facebook</ExternalLink>
            </li>
            <li>
              <ExternalLink href={settings.instagram_url}>Instagram</ExternalLink>
            </li>
            <li>
              <ExternalLink href={settings.constant_contact_volunteer_url}>
                Sign up to hear about volunteer opportunities
              </ExternalLink>
            </li>
            <li>
              <Link href="/join#newsletter">Sign up for our e-news</Link>
            </li>
          </ul>
          <p className="mt-6">Our mailing address is {settings.mailing_address}</p>
          <p className="mt-3">
            Email us at{" "}
            <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
          </p>
        </aside>
      </div>
    </div>
  );
}
