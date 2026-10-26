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

/** POINT's original embed snippet used this widget id; the current one lives in the embed URL. */
const DEFAULT_POINT_WIDGET_ID = "1149";

/** The `widgetId` query parameter of the POINT embed URL, which its resize helper expects. */
function pointWidgetId(embedUrl: string): string {
  try {
    return new URL(embedUrl).searchParams.get("widgetId") || DEFAULT_POINT_WIDGET_ID;
  } catch {
    return DEFAULT_POINT_WIDGET_ID;
  }
}

export default async function VolunteerPage() {
  const settings = await getSettings();
  const widgetId = pointWidgetId(settings.point_embed_url);

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
        <p>
          If no shifts are listed, join our{" "}
          <SmartLink href={settings.constant_contact_volunteer_url}>volunteer email list</SmartLink> and
          we&rsquo;ll tell you when the next ones open.
        </p>
      </div>

      <section className="mt-10" aria-label="Volunteer shifts">
        <p>
          <SmartLink href={settings.point_org_url} className="btn btn-secondary">
            Open the volunteer calendar on POINT
          </SmartLink>{" "}
          <a href="#after-point-calendar" className="ml-2 text-sm">
            Skip the calendar
          </a>
        </p>
        <iframe
          src={settings.point_embed_url}
          title="Volunteer shifts on POINT"
          width="100%"
          loading="lazy"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          id="point_iframe"
          className="mt-4 h-[2000px] w-full border-0 sm:h-[1650px]"
        />
        {/* Optional helper from POINT: resizes #point_iframe to fit its content. The embed works without it. */}
        <Script
          src="https://pointapp.org/embed/assets/js/iframe-scripts.js"
          strategy="lazyOnload"
          data-frame-id={widgetId}
        />
        <p id="after-point-calendar" className="mt-4">
          <SmartLink href={settings.point_org_url}>Open the volunteer calendar on POINT</SmartLink>
        </p>
      </section>
    </div>
  );
}
