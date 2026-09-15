import type { Metadata } from "next";
import Image from "next/image";
import { EventList } from "@/components/event-list";
import { SmartLink } from "@/components/smart-link";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { getUpcomingEvents } from "@/lib/events";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Bike Kitchen",
  description:
    "Recycle your old or unwanted bicycle: LTBC volunteers collect donated bikes, repair them, and give them to community members who need one.",
  alternates: { canonical: "/programs/bike-kitchen" },
  openGraph: {
    // Next replaces (never merges) the root layout's openGraph, so restate its shared fields.
    type: "website",
    siteName: "Lake Tahoe Bicycle Coalition",
    locale: "en_US",
    images: [
      {
        url: "/images/2022/09/unnamed.jpg",
        alt: "Volunteers repairing bikes on work stands at an outdoor Bike Kitchen fix-up event",
      },
    ],
  },
};

const gallery = [
  {
    src: "/images/2022/09/IMG_3107.jpg",
    alt: "Two volunteers fixing a bike on a repair stand outside a community building",
  },
  {
    src: "/images/2022/09/IMG_3110.jpg",
    alt: "Two smiling volunteers with refurbished bikes at a Bike Kitchen event",
  },
  {
    src: "/images/2022/09/IMG_7376.jpg",
    alt: "A volunteer kneeling on the pavement to assemble an adult tricycle",
  },
  {
    src: "/images/2022/09/IMG_1635.jpg",
    alt: "Two volunteers adjusting a bike clamped in a repair stand",
  },
  {
    src: "/images/2022/09/IMG_2848.jpg",
    alt: "A volunteer cleaning a mountain bike on a repair stand under the pines",
  },
];

export default async function BikeKitchenPage() {
  const [settings, events] = await Promise.all([getSettings(), getUpcomingEvents("BIKE_KITCHEN")]);
  const email = settings.bike_kitchen_email;

  const cards = [
    {
      title: "Donate",
      body: "Unused bicycle taking up space? Give back to the community by donating it! Email us with a photo of the bike, general specs, and any needed repairs.",
      cta: "Email us about a donation",
    },
    {
      title: "Need a bike?",
      body: "If you work for a social service organization and know someone who needs a bike, let us know so we can get them on our waitlist! Email us with the person's height and type of bike needed.",
      cta: "Email us about a bike request",
    },
    {
      title: "Join a fix-up!",
      body: "To keep up with demand and service the bikes we plan to donate, we host community fix-up events about once per month! Sign up for our newsletter or email us to learn how to join.",
      cta: "Email us to join a fix-up",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header>
        <h1>Bike Kitchen</h1>
        <p className="mt-4 text-xl">Recycle your old/unwanted bicycles to our bike kitchen program!</p>
        <Image
          src="/images/2022/09/unnamed.jpg"
          alt="Volunteers repairing bikes on work stands at an outdoor Bike Kitchen fix-up event"
          width={1600}
          height={1200}
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="mt-8 aspect-[2/1] h-auto w-full rounded-lg object-cover"
          priority
        />
      </header>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <h2 className="md:col-span-1">What is the Bike Kitchen?</h2>
        <p className="text-lg md:col-span-2">
          Through the Bike Kitchen, LTBC volunteers collect bikes from donors, perform needed repairs and
          maintenance to the bikes, and then donate them to community members by working directly with local
          social service organizations to identify individuals.
        </p>
      </section>

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <li key={card.title} className="flex flex-col gap-4 rounded-lg border border-asphalt/15 p-6">
            <h3>{card.title}</h3>
            <p className="flex-1">{card.body}</p>
            <p>
              <a href={`mailto:${email}`} className="btn btn-primary">
                {card.cta}
              </a>
            </p>
          </li>
        ))}
      </ul>

      <section className="mt-12 text-center">
        <h2>Email us</h2>
        <p className="mt-4 text-xl">
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      </section>

      <section className="mt-12">
        <h2>Upcoming Bike Kitchen Events</h2>
        <div className="mt-6">
          <EventList events={events} />
        </div>
        <p className="mt-6">
          <SmartLink href={settings.point_org_url}>See all volunteer shifts on POINT</SmartLink>
        </p>
      </section>

      <section className="mt-12" aria-label="Bike Kitchen video">
        <YouTubeEmbed id="P8cxjfCgRBw" title="Bike Kitchen video" />
      </section>

      <section className="mt-12" aria-label="Photo gallery">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {gallery.map((photo) => (
            <li key={photo.src} className="relative aspect-[4/5] overflow-hidden rounded-lg bg-bluebird/20">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
