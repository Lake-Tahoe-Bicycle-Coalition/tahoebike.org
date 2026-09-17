import type { Metadata } from "next";
import Link from "next/link";
import { ProgramCards, type ProgramCard } from "@/components/program-cards";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Our Programs",
  description:
    "What we’re working on to help Tahoe to become more bicycle friendly: bike maps, the Bike Kitchen, Bike Valet, bike racks, bike safety, advocacy, and Tahoe Bike Month.",
  alternates: { canonical: "/programs" },
};

export default async function ProgramsPage() {
  const settings = await getSettings();

  // Blurbs are drawn from each program's own page in the WordPress export.
  const programs: ProgramCard[] = [
    {
      title: "Bike Kitchen",
      blurb:
        "Recycle your old or unwanted bicycle: LTBC volunteers collect bikes from donors, perform needed repairs and maintenance, and donate them to community members through local social service organizations. Community fix-up events happen about once per month.",
      href: "/bike-kitchen",
    },
    {
      title: "Bike Valet",
      blurb:
        "Safe and convenient valet bicycle parking for Tahoe’s community events, at no cost to the bicyclists. A bike valet is like a coat check for bikes!",
      href: "/bike-valet",
    },
    {
      title: "Regional Bicycle Parking Program",
      blurb:
        "Launched in 2018, the program has resulted in 450 bike racks (900 bike parking spots) and eight fix-it stations on public lands and at businesses in the Tahoe Basin.",
      href: "/bike-racks",
    },
    {
      title: "Bike Safety",
      blurb:
        "If you’re biking roadways or bike paths in Lake Tahoe, we just want you to be safe. Watch our safety videos and brush up on ten tips for biking in Tahoe.",
      href: "/bike-safety",
    },
    {
      title: "Advocacy",
      blurb:
        "We advocate to jurisdictions around Lake Tahoe to make sure cyclists’ perspectives are accounted for in public infrastructure planning: invest in bike infrastructure, prioritize the important gaps, and get the details right.",
      href: "/advocacy",
    },
    {
      title: "Interactive Bike Map",
      blurb:
        "The Lake Tahoe Bikeways Map is Tahoe’s most comprehensive bike trail map. Find out where to ride and keep up to date on winter path conditions and construction.",
      href: settings.map_url,
      linkLabel: "Explore the map",
    },
    {
      title: "Printable Bike Map",
      blurb:
        "Pick up a paper map for free at all bike shops and visitor centers in Tahoe and Truckee, or download the Truckee / North Tahoe and South Tahoe maps as PDFs.",
      href: "/print-bike-map",
      linkLabel: "Get the map",
    },
    {
      title: "Tahoe Bike Month",
      blurb:
        "Our annual celebration of biking in Tahoe: ride bikes, win prizes, and attend events all month long.",
      href: settings.bike_month_url,
      linkLabel: "Visit Tahoe Bike Month",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1>Our Programs</h1>
      <p className="mt-4 max-w-3xl text-lg">
        What we’re working on to help Tahoe to become more bicycle friendly.
      </p>

      <div className="mt-10">
        <ProgramCards programs={programs} />
      </div>

      <section aria-labelledby="what-we-do-heading" className="mt-16">
        <h2 id="what-we-do-heading">What we do</h2>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="font-heading font-extrabold uppercase tracking-[0.1em]">
              Communications
            </dt>
            <dd className="mt-1">
              We write a newsletter and regularly post to social media. This website helps us keep
              the Bike Community informed. <Link href="/join#newsletter">Stay in touch</Link>!
            </dd>
          </div>
          <div>
            <dt className="font-heading font-extrabold uppercase tracking-[0.1em]">Wayfinding</dt>
            <dd className="mt-1">
              We publish information about bicycle trails around Lake Tahoe, including an
              interactive online bike map and a paper map.
            </dd>
          </div>
          <div>
            <dt className="font-heading font-extrabold uppercase tracking-[0.1em]">Events</dt>
            <dd className="mt-1">
              We run bike valets for events around the lake, rest stops at organized rides,
              implement the annual Tahoe Bike Month, and run a Bike Kitchen and Donation program.
            </dd>
          </div>
          <div>
            <dt className="font-heading font-extrabold uppercase tracking-[0.1em]">Advocacy</dt>
            <dd className="mt-1">
              We lobby local agencies and governments to develop bicycle infrastructure.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
