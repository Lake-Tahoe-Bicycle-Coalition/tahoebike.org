import Image from "next/image";
import { RackApplicationForm } from "@/components/forms/rack-application-form";
import { GoogleFormEmbed } from "@/components/google-form-embed";
import { GOOGLE_FORM_URLS, nativeFormEnabled } from "@/lib/feature-flags";
import { getSettings, settingIsTrue } from "@/lib/settings";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "Bike Racks",
  description:
    "Since 2018 the Regional Bicycle Parking Program has placed 450 bike racks and eight fix-it stations on public lands and at businesses in the Tahoe Basin.",
  path: "/bike-racks",
  image: {
    url: "/images/2022/06/bike-rack.jpg",
    alt: "A row of bicycles parked at an inverted-U bike rack",
  },
});

const photos = [
  {
    src: "/images/2022/06/Patriotic-Tandem.jpg",
    alt: "A red, white and blue tandem bicycle locked to an inverted-U bike rack",
  },
  {
    src: "/images/2022/06/Cove-East-Rack-2.jpg",
    alt: "A new inverted-U bike rack installed at Cove East",
  },
  {
    src: "/images/2022/06/Baldwin-Beach.jpg",
    alt: "Bicycles parked at the racks at Baldwin Beach",
  },
];

export default async function BikeRacksPage() {
  const settings = await getSettings();
  const programOpen = settingIsTrue(settings.rack_program_open);
  const contactLink = <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header>
        <h1>Regional Bicycle Parking Program</h1>
        <Image
          src="/images/2022/06/bike-rack.jpg"
          alt="A row of bicycles parked at an inverted-U bike rack"
          width={793}
          height={376}
          priority
          className="mt-8 h-auto w-full max-w-3xl rounded"
        />
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <div className="prose-ltbc">
          <h2 className="mt-0!">About The Regional Parking Program</h2>
          <p>
            The Lake Tahoe Bicycle Coalition launched the Regional Bicycle Parking Program in 2018.
            Since its inception, the program has resulted in 450 bike racks (900 bike parking
            spots), and eight fix-it stations located on public lands and businesses in the Tahoe
            Basin.
          </p>
          <p>
            The environmental impacts of automobile congestion are a major concern to the fragile
            ecosystems surrounding Lake Tahoe and Truckee. Traffic delays contribute to high levels
            of carbon monoxide and reduce the quality of experience for visitors, quality of life
            for residents, and the quality of the environment for everyone. Studies out of UC
            Davis’ Sustainable Transportation Center have concluded that providing secure and
            proximate bicycle parking is a main factor in encouraging increased ridership.
          </p>
          <p>
            Lake Tahoe Bicycle Coalition launched the Regional Bicycle Parking Program in the Tahoe
            Basin to help implement TRPA and local plans, goals, and policies. The Coalition began
            with a bike parking needs assessment conducted by TRPA with support from LTBC in 2016.
            A similar effort was undertaken in Truckee in 2015 with the Trails and Bikeways Master
            Plan. By increasing bicycle parking the Lake Tahoe Bicycle Coalition will help
            implement TRPA and The Town of Truckee’s plans, goals, and policies, and increase
            bicycle ridership which would result in a reduction in air pollution.
          </p>

          <h2>Current Projects</h2>
          <p>
            The Lake Tahoe Bicycle Coalition now offers low or no-cost bike racks to interested
            businesses in Truckee, made possible through a generous grant from the Lahontan
            Community Foundation Fund held at the Parasol Tahoe Community Foundation. The program
            is designed to encourage locals and visitors to ride their bikes around lakeside
            communities instead of driving.
          </p>
          {programOpen ? (
            <>
              <p>
                Applications are open. Truckee businesses interested in bike racks are invited to
                apply using the form on this page. The Coalition is offering Hoop Runner or
                “Inverted-U” style bike racks, with bolt-down and free-standing versions
                available. Interested businesses will be selected by the Bike Coalition based on
                criteria that include their ability to provide matching funds, experienced or
                projected bike rack use, and community benefit based on surrounding businesses or
                services.
              </p>
              <p>
                The Bike Coalition will be responsible for all orders, shipping, and delivery of
                the bike racks on behalf of the selected businesses.
              </p>
            </>
          ) : (
            <p>
              The program is not currently accepting applications. If your business would like
              bike racks, email us at {contactLink} and we will let you know when the next
              application period opens.
            </p>
          )}

          <h2>Questions?</h2>
          <p>Send an email to {contactLink}.</p>

          <ul className="grid grid-cols-2 gap-4" aria-label="Bike rack photos">
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

        {programOpen ? (
          <section aria-labelledby="rack-application-heading">
            <h2 id="rack-application-heading">Apply for Bike Racks</h2>
            <p className="mt-4 font-bold">Truckee businesses, apply here for bike racks!</p>
            <div className="mt-6">
              {/* Q17: the Google Form from the old site unless NATIVE_FORMS enables the native form.
                  Either way the form only appears while rack_program_open is true. */}
              {nativeFormEnabled("racks") ? (
                <RackApplicationForm />
              ) : (
                <GoogleFormEmbed url={GOOGLE_FORM_URLS.racks} title="Bike rack application form" />
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
