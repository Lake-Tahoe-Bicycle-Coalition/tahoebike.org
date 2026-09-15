import type { Metadata } from "next";
import Image from "next/image";
import { SmartLink } from "@/components/smart-link";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Printable Bike Map",
  description:
    "Pick up a free copy of the Lake Tahoe bike map at bike shops and visitor centers in Tahoe and Truckee, or download the Truckee / North Tahoe and South Tahoe maps as PDFs.",
  alternates: { canonical: "/print-bike-map" },
  openGraph: {
    // Next replaces (never merges) the root layout's openGraph, so restate its shared fields.
    type: "website",
    siteName: "Lake Tahoe Bicycle Coalition",
    locale: "en_US",
    images: [
      {
        url: "/images/2026/06/LTBC_SouthLake-2026-print.jpg",
        alt: "South Tahoe bike map, 2026 print edition",
      },
    ],
  },
};

/** The 2026 print maps. Image files are 1908x1404 (landscape); PDFs live on Google Drive. */
const maps = [
  {
    id: "north",
    heading: "Truckee / North Tahoe Bike Map",
    src: "/images/2026/06/LTBC_NorthLake-2026-print.jpg",
    alt: "Truckee / North Tahoe bike map, 2026 print edition",
    pdfUrl: "https://drive.google.com/file/d/1Ot-mzjcdIkMoOgk9Y_uPUiqPqtSlXgGo/view?usp=drive_link",
  },
  {
    id: "south",
    heading: "South Tahoe Bike Map",
    src: "/images/2026/06/LTBC_SouthLake-2026-print.jpg",
    alt: "South Tahoe bike map, 2026 print edition",
    pdfUrl: "https://drive.google.com/file/d/15NGWXz1381Fs8Z3F34-9CDS3MMW_NlXT/view?usp=drive_link",
  },
];

/** "map.tahoebike.org" for https://map.tahoebike.org/; the raw value if it is not a URL. */
function hostLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default async function PrintBikeMapPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1>Printable Bike Map</h1>
      <div className="prose-ltbc mt-4">
        <p>
          Pick up a copy for free at all bike shops and visitor centers in Tahoe and Truckee, or
          save the paper and view the map online at{" "}
          <SmartLink href={settings.map_url}>{hostLabel(settings.map_url)}</SmartLink>
          .
        </p>
        <p>Click the images below to download a PDF.</p>
      </div>

      {maps.map((map) => (
        <section key={map.id} aria-labelledby={`${map.id}-map-heading`} className="mt-12">
          <h2 id={`${map.id}-map-heading`}>{map.heading}</h2>
          <a
            href={map.pdfUrl}
            target="_blank"
            rel="noopener"
            className="mt-4 block overflow-hidden rounded-lg border border-asphalt/10"
          >
            <Image
              src={map.src}
              alt={`${map.alt} (PDF, opens in a new tab)`}
              width={1908}
              height={1404}
              sizes="(min-width: 896px) 864px, 100vw"
              className="h-auto w-full"
            />
          </a>
          <p className="mt-4">
            <SmartLink href={map.pdfUrl} className="btn btn-secondary">
              Download the PDF
              <span className="sr-only">: {map.heading}</span>
            </SmartLink>
          </p>
        </section>
      ))}
    </div>
  );
}
