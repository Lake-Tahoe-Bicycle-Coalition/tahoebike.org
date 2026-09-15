import type { Metadata } from "next";
import Script from "next/script";
import { SmartLink } from "@/components/smart-link";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Volunteer",
  description:
    "Volunteers are at the heart of our mission to create a more bike-friendly and sustainable Tahoe. Sign up for a shift on POINT or join our volunteer email list.",
  alternates: { canonical: "/volunteer" },
};

export default async function VolunteerPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1>Volunteer</h1>
      <div className="prose-ltbc mt-6 max-w-3xl text-lg">
        <p>
          Volunteers are at the heart of our mission to create a more bike-friendly and sustainable Tahoe.
          There are numerous opportunities to volunteer, and it is a great way to show your support, get
          involved, and meet fun people. Sign up for one of our volunteer opportunities below! Simply click the
          event, create a POINT account, and sign up for a shift!
        </p>
        <p>
          Want to stay in the loop? Join our{" "}
          <SmartLink href={settings.constant_contact_volunteer_url}>volunteer email list</SmartLink>{" "}
          to receive the latest updates and upcoming opportunities.
        </p>
      </div>

      <section className="mt-10" aria-label="Volunteer shifts">
        <iframe
          src={settings.point_embed_url}
          title="Volunteer shifts on POINT"
          width="100%"
          height={1650}
          loading="lazy"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          id="point_iframe"
          className="w-full border-0"
        />
        {/* Optional helper from POINT: resizes #point_iframe to fit its content. The embed works without it. */}
        <Script src="https://pointapp.org/embed/assets/js/iframe-scripts.js" strategy="lazyOnload" data-frame-id="1149" />
        <p className="mt-4">
          <SmartLink href={settings.point_org_url}>Open the volunteer calendar on POINT</SmartLink>
        </p>
      </section>
    </div>
  );
}
