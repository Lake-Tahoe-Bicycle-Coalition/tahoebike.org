import Image from "next/image";
import Link from "next/link";
import { EventList } from "@/components/event-list";
import { SmartLink } from "@/components/smart-link";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { getUpcomingEvents } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "Bike Kitchen",
  description:
    "Recycle your old or unwanted bicycle: LTBC volunteers collect donated bikes, repair them, and give them to community members who need one.",
  path: "/bike-kitchen",
  image: {
    url: "/images/2022/09/unnamed.jpg",
    alt: "Volunteers repairing bikes on work stands at an outdoor Bike Kitchen fix-up event",
  },
});

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

function mailtoLink(email: string, subject: string, body: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default async function BikeKitchenPage() {
  const [settings, events] = await Promise.all([getSettings(), getUpcomingEvents("BIKE_KITCHEN")]);
  const email = settings.bike_kitchen_email;

  const cards = [
    {
      title: "Donate",
      body: "Unused bicycle taking up space? Give back to the community by donating it! Email us with a photo of the bike, general specs, and any needed repairs.",
      cta: "Donate a bike",
      href: mailtoLink(
        email,
        "Bike donation",
        "Hi LTBC,\n\nI'd like to donate a bike.\n\nBike (brand/size/type):\nCondition / needed repairs:\nPhoto: (attach)\n",
      ),
    },
    {
      title: "Need a bike?",
      body: "If you work for a social service organization and know someone who needs a bike, let us know so we can get them on our waitlist! Email us with the person’s height and type of bike needed.",
      cta: "Request a bike",
      href: mailtoLink(
        email,
        "Bike request",
        "Hi LTBC,\n\nI'd like to request a bike for someone.\n\nOrganization:\nPerson's height:\nType of bike needed:\n",
      ),
    },
    {
      title: "Join a fix-up!",
      body: "To keep up with demand and service the bikes we plan to donate, we host community fix-up events about once per month! Sign up for a shift on POINT and come learn alongside us.",
      cta: "Join a fix-up",
      href: settings.point_org_url,
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

      <section className="mt-12">
        <h2>Upcoming Bike Kitchen Events</h2>
        <div className="mt-6">
          <EventList
            events={events}
            emptyState={
              <>
                <p>
                  No fix-ups are scheduled right now. They run roughly monthly from spring through
                  fall, and we announce each one in the newsletter.
                </p>
                <p className="mt-2">
                  In the meantime you can still{" "}
                  <a href={mailtoLink(email, "Bike donation", "Hi LTBC,\n\nI’d like to donate a bike.\n")}>
                    donate a bike
                  </a>{" "}
                  or <a href={mailtoLink(email, "Bike request", "Hi LTBC,\n\nI’d like to request a bike.\n")}>request one</a> by email, or{" "}
                  <Link href="/newsletter">subscribe to the newsletter</Link> to hear about the next
                  event.
                </p>
              </>
            }
          />
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <h2 className="md:col-span-1">What is the Bike Kitchen?</h2>
        <div className="space-y-4 text-lg md:col-span-2">
          <p>
            The Bike Kitchen is a community bike shop run by volunteers of the Lake Tahoe Bicycle Coalition (LTBC). We collect donated bikes,
            repair them, and give them to community members who need one, working directly with local
            social service organizations to find the right people.
          </p>
          <p>
            It is also a place to learn. At our monthly fix-up events, experienced volunteers will show you
            how to fix and maintain your own bike, and you will join a community of people who take care of
            bikes together and for each other.
          </p>
        </div>
      </section>

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <li key={card.title} className="flex flex-col gap-4 rounded-lg border border-asphalt/15 p-6">
            <h3>{card.title}</h3>
            <p className="flex-1">{card.body}</p>
            <p>
              <SmartLink href={card.href} className="btn btn-primary">
                {card.cta}
              </SmartLink>
            </p>
          </li>
        ))}
      </ul>

      <section className="mt-12" aria-labelledby="bike-kitchen-video-heading">
        <h2 id="bike-kitchen-video-heading">See the Bike Kitchen in action</h2>
        <div className="mt-6">
          <YouTubeEmbed id="P8cxjfCgRBw" title="Bike Kitchen program video" />
        </div>
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
