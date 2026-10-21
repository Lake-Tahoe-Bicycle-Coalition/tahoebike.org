"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { SmartLink } from "@/components/smart-link";

const secondaryOnDark =
  "btn border-2 border-white bg-transparent text-white no-underline hover:bg-white hover:text-deepwater";

/** Full-bleed "Support the Coalition" call to action above the footer. Hidden on /join and /admin. */
export function SupportBand() {
  const pathname = usePathname();
  if (pathname === "/join" || pathname.startsWith("/join/") || pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }

  return (
    <section aria-labelledby="support-band-heading" data-print-hide className="mt-16 bg-deepwater text-white">
      <div className="mx-auto grid w-full max-w-6xl md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-80">
          <Image
            src="/images/2022/09/IMG_3110.jpg"
            alt="Two smiling volunteers with refurbished bikes at a Bike Kitchen event"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center gap-4 px-4 py-10 md:px-10">
          <h2 id="support-band-heading" className="text-2xl text-white sm:text-3xl">
            Support the Coalition
          </h2>
          <p className="text-white/90">
            We’re an all-volunteer nonprofit. Your membership, donation or time keeps the bike map
            free, puts donated bikes back on the road and parks bikes at events around the lake.
          </p>
          <p className="flex flex-wrap gap-3">
            <SmartLink href="/join#donate" className="btn btn-primary">
              Donate
            </SmartLink>
            <SmartLink href="/join" className={secondaryOnDark}>
              Join
            </SmartLink>
            <SmartLink href="/volunteer" className={secondaryOnDark}>
              Volunteer
            </SmartLink>
          </p>
        </div>
      </div>
    </section>
  );
}
