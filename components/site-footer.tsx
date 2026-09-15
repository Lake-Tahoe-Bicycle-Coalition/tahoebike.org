import { SmartLink } from "@/components/smart-link";
import { footerColumns } from "@/lib/navigation";
import type { Settings } from "@/lib/settings";

export function SiteFooter({ settings }: { settings: Settings }) {
  const social = [
    { label: "Facebook", href: settings.facebook_url },
    { label: "Instagram", href: settings.instagram_url },
  ];

  return (
    <footer className="mt-16 bg-asphalt text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        {footerColumns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="mb-3 text-base text-safety">{column.heading}</h2>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <SmartLink href={link.href} className="text-white">
                    {link.label}
                  </SmartLink>
                </li>
              ))}
              {column.heading === "Get Involved"
                ? social.map((link) => (
                    <li key={link.label}>
                      <SmartLink href={link.href} className="text-white">
                        {link.label}
                      </SmartLink>
                    </li>
                  ))
                : null}
            </ul>
          </nav>
        ))}
        <div>
          <h2 className="mb-3 text-base text-safety">Lake Tahoe Bicycle Coalition</h2>
          <p>Helping Tahoe become more bicycle friendly.</p>
          <p className="mt-3">{settings.mailing_address}</p>
          <p className="mt-3">
            <a href={`mailto:${settings.contact_email}`} className="text-white">
              {settings.contact_email}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-sm text-white/70">
        © {new Date().getFullYear()} Lake Tahoe Bicycle Coalition, an all-volunteer nonprofit.
      </div>
    </footer>
  );
}
