import type { Metadata } from "next";
import Image from "next/image";
import { HeroCards } from "@/components/hero-cards";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { PhotoGallery, type Photo } from "@/components/photo-gallery";
import { SmartLink } from "@/components/smart-link";
import { getHomepageCards } from "@/lib/content";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: { absolute: "Lake Tahoe Bicycle Coalition" },
  description:
    "Helping Tahoe become more bicycle friendly: the Lake Tahoe Bicycle Coalition produces Tahoe’s most comprehensive bike trail map and runs bike programs, events, and advocacy around the lake.",
  alternates: { canonical: "/" },
};

/** The two Divi galleries on the WordPress home page, in their original order. */
const galleryPhotos: Photo[] = [
  {
    src: "/images/2022/05/Lakeview-Valet.jpg",
    alt: "Bikes parked at the Lake Tahoe Bicycle Coalition bike valet at Lakeview Commons",
  },
  {
    src: "/images/2022/05/Bike-valet-in-action.jpg",
    alt: "Volunteers checking in bicycles at a bike valet during a community event",
  },
  {
    src: "/images/2022/06/Baldwin-Beach.jpg",
    alt: "Bicycles parked at bike racks on the sand at Baldwin Beach, with Lake Tahoe behind",
  },
  {
    src: "/images/2022/09/IMG_2848.jpg",
    alt: "A volunteer working on a donated bicycle at a Bike Kitchen fix-up event",
  },
  {
    src: "/images/2022/05/IMG_2041.jpg",
    alt: "Riders gathered with their bikes at a Lake Tahoe Bicycle Coalition event",
  },
  {
    src: "/images/2022/05/2020.05.07_Biking_Upper-Truckee-Marsh_California-Tahoe-Conservancy_DSC_2193.jpg",
    alt: "Two people biking the path through the Upper Truckee Marsh with mountains behind",
  },
  {
    src: "/images/2022/04/June-3-bike-path-cleanup.jpg",
    alt: "Volunteers with their bikes, trash bags and litter grabbers gathered on a Tahoe bike path for a cleanup",
  },
  {
    src: "/images/2024/04/bike_valet2.jpg",
    alt: "Rows of bicycles parked inside the fenced bike valet at an event",
  },
];

export default async function HomePage() {
  const [settings, cards] = await Promise.all([getSettings(), getHomepageCards()]);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-deepwater">
        <Image
          src="/images/2022/06/Baldwin-Beach.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-deepwater/90 to-deepwater/60" aria-hidden="true" />
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-16">
          <h1 className="max-w-3xl text-2xl text-white sm:text-4xl">
            Helping Tahoe become more bicycle friendly
          </h1>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-16 px-4 py-12">
        <HeroCards cards={cards} />

        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="bike-map-heading" className="flex flex-col gap-4">
            <SmartLink
              href={settings.map_url}
              className="block overflow-hidden rounded-lg border border-asphalt/10"
            >
              <Image
                src="/images/2022/05/Bike-Map-screen.jpg"
                alt="Screenshot of the interactive Lake Tahoe Bikeways Map"
                width={1467}
                height={792}
                sizes="(min-width: 1024px) 560px, 100vw"
                className="h-auto w-full"
              />
            </SmartLink>
            <h2 id="bike-map-heading">Online Bike Map</h2>
            <p>
              Produced by the Lake Tahoe Bicycle Coalition, the Lake Tahoe Bikeways Map is Tahoe’s
              most comprehensive bike trail map. Check out our new, interactive bike map!
            </p>
            <p>
              <SmartLink href={settings.map_url} className="btn btn-primary">
                Explore the map
              </SmartLink>
            </p>
          </section>

          <NewsletterSignupForm
            signupUrl={settings.constant_contact_signup_url}
            archiveHref="/newsletter"
          />
        </div>

        <PhotoGallery photos={galleryPhotos} />

        <section aria-labelledby="follow-heading">
          <h2 id="follow-heading">Follow us</h2>
          <ul className="mt-4 flex flex-wrap gap-4">
            <li>
              <SmartLink href={settings.facebook_url} className="btn btn-secondary">
                Facebook
              </SmartLink>
            </li>
            <li>
              <SmartLink href={settings.instagram_url} className="btn btn-secondary">
                Instagram
              </SmartLink>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
