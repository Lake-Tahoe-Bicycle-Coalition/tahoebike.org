import type { Metadata } from "next";
import Image from "next/image";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Advocacy",
  description:
    "The Lake Tahoe Bicycle Coalition advocates to jurisdictions around Lake Tahoe to help make sure that cyclists' perspectives are accounted for in public infrastructure planning.",
  alternates: { canonical: "/advocacy" },
  openGraph: {
    // Next replaces (never merges) the root layout's openGraph, so restate its shared fields.
    type: "website",
    siteName: "Lake Tahoe Bicycle Coalition",
    locale: "en_US",
    images: [
      {
        url: "/images/2026/05/IMG_8347.jpeg",
        alt: "A “Share the Road” sign beside a road-work sign at a signalized crosswalk on a Tahoe street",
      },
    ],
  },
};

const COMMENT_LETTERS_FOLDER_ID = "1bmu9wsRb_B1E4iSSVS1JgPft7eRCUrx6";

export default async function AdvocacyPage() {
  const settings = await getSettings();

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

      <div className="prose-ltbc mt-12 max-w-3xl text-lg">
        <p>
          The Lake Tahoe Bicycle Coalition advocates to jurisdictions around Lake Tahoe to help make sure that
          cyclists&apos; perspectives are accounted for in public infrastructure planning. Our advocacy focuses on
          three priorities:
        </p>
        <ol>
          <li>
            <strong>Invest in Bike Infrastructure.</strong> There&apos;s a large backlog of projects to build, and
            we&apos;re pushing to accelerate progress through that list.
          </li>
          <li>
            <strong>Prioritize the Important Gaps.</strong> Not all projects offer the same value. We weigh in on
            what&apos;s most important.
          </li>
          <li>
            <strong>Get the Details Right.</strong> When designing these projects, make sure they work well for
            the cyclists who will use them.
          </li>
        </ol>
        <p>
          <strong>Got Ideas?</strong> Let us know! We&apos;re always trying to hear from the community to reflect
          all of our ideas in our advocacy. Please email{" "}
          <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
        </p>

        <h2>Comment Letters</h2>
        <p>
          We often write comment letters to jurisdictions to weigh in on proposed projects. New in 2026, we are
          taking inventory of past comment letters and sharing them here for the public to see. Curious about a
          project that&apos;s not yet listed here? Please let us know!
        </p>
      </div>

      <section className="mt-8" aria-label="Comment letters">
        <iframe
          src={`https://drive.google.com/embeddedfolderview?id=${COMMENT_LETTERS_FOLDER_ID}#list`}
          title="Comment letters folder"
          loading="lazy"
          className="h-[600px] w-full border-0"
        />
        <p className="mt-4">
          <a href={`https://drive.google.com/drive/folders/${COMMENT_LETTERS_FOLDER_ID}`} target="_blank" rel="noopener">
            Open the comment letters folder in Google Drive
          </a>
        </p>
      </section>
    </div>
  );
}
