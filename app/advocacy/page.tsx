import Image from "next/image";
import { AdvocacyEfforts } from "@/components/advocacy-efforts";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { SmartLink } from "@/components/smart-link";
import { COMMENT_LETTERS_FOLDER_URL, getAdvocacyEfforts } from "@/lib/advocacy";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "Advocacy",
  description:
    "The Lake Tahoe Bicycle Coalition advocates to jurisdictions around Lake Tahoe to help make sure that cyclists' perspectives are accounted for in public infrastructure planning.",
  path: "/advocacy",
  image: {
    url: "/images/2026/05/IMG_8347.jpeg",
    alt: "A “Share the Road” sign beside a road-work sign at a signalized crosswalk on a Tahoe street",
  },
});

/** The three advocacy priorities, shown as numbered tiles. */
const priorities = [
  {
    title: "Invest in bike infrastructure",
    explanation:
      "There’s a large backlog of projects to build, and we’re pushing to accelerate progress through that list.",
  },
  {
    title: "Prioritize the important gaps",
    explanation: "Not all projects offer the same value. We weigh in on what’s most important.",
  },
  {
    title: "Get the details right",
    explanation:
      "When designing these projects, make sure they work well for the cyclists who will use them.",
  },
];

/** A mailto: link with its subject line filled in. */
function mailtoWithSubject(address: string, subject: string): string {
  return `mailto:${address}?subject=${encodeURIComponent(subject)}`;
}

export default async function AdvocacyPage() {
  const settings = await getSettings();
  const efforts = getAdvocacyEfforts();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header>
        <h1>Helping Tahoe Become More Bike Friendly</h1>
        <div className="relative mt-8 aspect-[2/1] w-full overflow-hidden rounded-lg bg-bluebird/20">
          <Image
            src="/images/2026/05/IMG_8347.jpeg"
            alt="A “Share the Road” sign beside a road-work sign at a signalized crosswalk on a Tahoe street"
            fill
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </header>

      <p className="mt-12 max-w-3xl text-lg">
        The Lake Tahoe Bicycle Coalition advocates to jurisdictions around Lake Tahoe to help make sure
        that cyclists&apos; perspectives are accounted for in public infrastructure planning. Our advocacy
        focuses on three priorities:
      </p>
      <ol className="mt-6 grid gap-6 md:grid-cols-3">
        {priorities.map((priority, index) => (
          <li key={priority.title} className="flex flex-col rounded-lg border border-asphalt/10 bg-white p-5">
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-14 items-center justify-center self-start rounded-md bg-safety font-heading text-2xl font-extrabold text-asphalt"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="mt-4 text-xl sm:text-xl">{priority.title}</h2>
            <p className="mt-2">{priority.explanation}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 max-w-3xl">
        <strong>Got ideas?</strong> Let us know! We&apos;re always trying to hear from the community to reflect
        all of our ideas in our advocacy. Please email{" "}
        <a href={mailtoWithSubject(settings.contact_email, "Advocacy idea")}>{settings.contact_email}</a>.
      </p>

      <section className="mt-12 max-w-4xl" aria-labelledby="efforts-heading">
        <h2 id="efforts-heading">Recent Advocacy</h2>
        <p className="mt-4 max-w-3xl text-lg">
          We write comment letters to jurisdictions to weigh in on proposed projects. Here is a summary of
          each effort, newest first, with the letters themselves. Curious about a project that&apos;s not
          listed here? Please{" "}
          <a href={mailtoWithSubject(settings.contact_email, "Advocacy project not listed on tahoebike.org")}>
            let us know
          </a>
          !
        </p>
        <div className="mt-6">
          <AdvocacyEfforts efforts={efforts} />
        </div>
        <p className="mt-8">
          <SmartLink href={COMMENT_LETTERS_FOLDER_URL} className="btn btn-secondary">
            Browse all letters on Google Drive
          </SmartLink>
        </p>
      </section>

      {/* The three project topics ticked to begin with; General Info stays unticked so an
          advocacy-alerts-only signup is the default. */}
      <div className="mt-10 max-w-3xl">
        <NewsletterSignupForm
          id="signup"
          heading="Hear about projects while there's still time to comment"
          intro="Tell us where you ride and we'll email you when a project there is open for public comment. You can also get the monthly newsletter, or just the alerts."
          mode="full"
          defaultLists={["advocacy_south", "advocacy_north", "advocacy_truckee"]}
        />
      </div>
    </div>
  );
}
