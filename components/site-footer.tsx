import Image from "next/image";
import Link from "next/link";
import { FacebookIcon, InstagramIcon } from "@/components/icons";
import { SmartLink } from "@/components/smart-link";
import { footerColumns } from "@/lib/navigation";
import type { Settings } from "@/lib/settings";

const headingClass = "mb-3 text-base font-bold text-safety";
const socialClass =
  "flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white hover:text-asphalt";

export function SiteFooter({ settings }: { settings: Settings }) {
  const social = [
    { label: "Facebook", href: settings.facebook_url, Icon: FacebookIcon },
    { label: "Instagram", href: settings.instagram_url, Icon: InstagramIcon },
  ];

  return (
    <footer className="bg-asphalt text-white">
      <nav aria-label="Footer" className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        {footerColumns.map((column) => (
          <div key={column.heading}>
            <p className={headingClass}>{column.heading}</p>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <SmartLink href={link.href} className="flex min-h-11 items-center text-white">
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <Image
            src="/images/2026/10/LTBC-Logo-white.png"
            alt="Lake Tahoe Bicycle Coalition"
            width={5256}
            height={1710}
            sizes="200px"
            className="mb-4 h-auto w-48"
          />
          <p className="font-heading text-lg font-extrabold uppercase leading-snug tracking-[0.06em]">
            Helping Tahoe become more bicycle friendly
          </p>
          <div className="mt-4 space-y-2 text-sm text-white/80">
            <p>{settings.mailing_address}</p>
            <p>
              <a href={`mailto:${settings.contact_email}`} className="text-white/80 hover:text-white">
                {settings.contact_email}
              </a>
            </p>
          </div>
          <ul className="mt-4 flex gap-3">
            {social.map(({ label, href, Icon }) => (
              <li key={label}>
                <SmartLink href={href} iconless aria-label={label} className={socialClass}>
                  <Icon className="h-5 w-5" />
                </SmartLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="border-t border-white/10 px-4 py-4 text-center text-sm text-white/70">
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <span>
            © {new Date().getFullYear()} Lake Tahoe Bicycle Coalition, an all-volunteer nonprofit.
          </span>
          <Link href="/privacy-policy" className="text-white/70 decoration-white/40 hover:text-white">
            Privacy policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
