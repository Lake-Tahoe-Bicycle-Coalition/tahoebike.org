import Image from "next/image";
import Link from "next/link";
import { ValetRequestForm } from "@/components/forms/valet-request-form";
import { GoogleFormEmbed } from "@/components/google-form-embed";
import { GOOGLE_FORM_URLS, nativeFormEnabled } from "@/lib/feature-flags";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "Bike Valet",
  description:
    "The Lake Tahoe Bicycle Coalition provides safe and convenient valet bicycle parking for Tahoe’s community events, at no cost to the bicyclists.",
  path: "/programs/bike-valet",
  image: {
    url: "/images/2022/05/Bike-valet-in-action.jpg",
    alt: "Volunteers checking bikes into a busy bike valet corral at a community event",
  },
});

const photos = [
  {
    src: "/images/2022/05/Bike-valet-in-action.jpg",
    alt: "Volunteers checking bikes into a busy bike valet corral at a community event",
  },
  {
    src: "/images/2022/05/Lakeview-Valet.jpg",
    alt: "Rows of bicycles parked at the bike valet at Lakeview Commons",
  },
  {
    src: "/images/2022/05/Bike-Valet-2016-Cycle-Celebration-3.jpg",
    alt: "The bike valet tent and racks at the 2016 Cycle Celebration",
  },
  {
    src: "/images/2022/05/Bike-Valet_Live@Lakeview-2019.6-3.jpg",
    alt: "Bikes lined up in the valet at a Live at Lakeview concert in 2019",
  },
];

export default async function BikeValetPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Bike Valet</h1>
          <p className="mt-3 text-xl font-semibold">It’s like coat check for your bike!</p>
        </div>
        <Image
          src="/images/2022/05/Bike-Valet-Main-Image.png"
          alt="Bike Valet: bicycles parked in a fenced valet corral"
          width={300}
          height={250}
          priority
          className="h-auto w-[300px] max-w-full"
        />
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <div className="prose-ltbc">
          <h2 className="mt-0!">About Valet Bike Parking</h2>
          <p>
            As part of our mission to help make Tahoe more bike friendly, the Lake Tahoe Bicycle
            Coalition is happy to provide safe and convenient valet bicycle parking for Tahoe’s
            community events, at no cost to the bicyclists. A bike valet is like a coat check for
            bikes!
          </p>
          <p>
            You can attract more people to your event and support biking in Tahoe when you host a
            bike valet. The Bike Coalition and our trained volunteers bring everything that is
            needed: portable bike racks, perimeter fencing, and a ticketing system to keep track of
            parked bicycles; and we are fully insured to cover any damage or theft issues.
          </p>
          <p>
            For a typical event, our rates start at ${settings.bike_valet_daily_rate} per day. Your
            investment helps cover the cost of maintaining our equipment, and because we are an
            all-volunteer organization, the rest goes straight to programs that promote biking in
            the Tahoe region. Nonprofit organizations and Bike Coalition Business Members may be
            able to secure the valet at a pro bono or discount rate. Please fill out the request
            form below to get started and receive a quote.
          </p>

          <h2>Volunteer</h2>
          <p>
            Our program is run by our volunteer board of directors and supported by amazing
            volunteers from the community. If you would like to help support a safe and fun biking
            culture in Tahoe (and attend some fun events), please fill out our{" "}
            <Link href="/volunteer">volunteer form</Link> to help the Bike Coalition park bikes.
          </p>

          <h2>Questions or want to volunteer?</h2>
          <p>
            Send an email to{" "}
            <a href={`mailto:${settings.bike_valet_email}`}>{settings.bike_valet_email}</a>.
          </p>

          <ul className="grid grid-cols-2 gap-4" aria-label="Bike valet photos">
            {photos.map((photo) => (
              <li key={photo.src} className="relative aspect-4/3 overflow-hidden rounded">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </div>

        <section aria-labelledby="valet-request-heading">
          <h2 id="valet-request-heading">Request for an Event</h2>
          <div className="mt-6">
            {/* Q16: the Google Form from the old site unless NATIVE_FORMS enables the native form. */}
            {nativeFormEnabled("valet") ? (
              <ValetRequestForm />
            ) : (
              <GoogleFormEmbed url={GOOGLE_FORM_URLS.valet} title="Bike valet request form" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
