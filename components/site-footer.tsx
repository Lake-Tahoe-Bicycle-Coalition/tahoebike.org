import Image from "next/image";
import Link from "next/link";
import { FacebookIcon, InstagramIcon } from "@/components/icons";
import { SmartLink } from "@/components/smart-link";
import { footerColumns } from "@/lib/navigation";
import type { Settings } from "@/lib/settings";

const socialClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white hover:text-asphalt";

export function SiteFooter({ settings }: { settings: Settings }) {
  const social = [
    { label: "Facebook", href: settings.facebook_url, Icon: FacebookIcon },
    { label: "Instagram", href: settings.instagram_url, Icon: InstagramIcon },
  ];

  return (
    <footer className="mt-16 bg-asphalt text-white">
      {/* Phones: the two link columns side by side, the brand block below. md+: three columns. */}
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 md:grid-cols-[3fr_2fr] md:gap-12 md:py-12">
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6">
          {footerColumns.map((column) => (
            <div key={column.heading}>
              <h2 className="mb-1 text-base text-safety">{column.heading}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    {/* 32px rows: above WCAG 2.2's 24px target minimum without stretching the footer. */}
                    <SmartLink href={link.href} className="flex min-h-8 items-center leading-tight text-white">
                      {link.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div>
          <Image
            src="/images/2026/10/LTBC-Logo-white.png"
            alt="Lake Tahoe Bicycle Coalition"
            width={5256}
            height={1710}
            sizes="200px"
            className="mb-3 h-auto w-44 md:w-48"
          />
          <p className="font-heading text-base font-extrabold uppercase leading-snug tracking-[0.06em] text-balance md:text-lg">
            Helping Tahoe become more bicycle friendly
          </p>
          <div className="mt-3 space-y-1 text-sm text-white/80">
            <p>{settings.mailing_address}</p>
            <p>
              <a href={`mailto:${settings.contact_email}`} className="text-white/80 hover:text-white">
                {settings.contact_email}
              </a>
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <ul className="flex gap-3">
              {social.map(({ label, href, Icon }) => (
                <li key={label}>
                  <SmartLink href={href} aria-label={label} className={socialClass}>
                    <Icon className="h-5 w-5" />
                  </SmartLink>
                </li>
              ))}
            </ul>
            <Link href="/privacy-policy" className="ml-2 text-sm text-white/70 decoration-white/40 hover:text-white">
              Privacy policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
