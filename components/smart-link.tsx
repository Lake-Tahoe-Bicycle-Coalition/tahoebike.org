import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLinkIcon } from "@/components/icons";
import { isExternalUrl, isSitePath } from "@/lib/urls";

type Props = {
  href: string;
  className?: string;
  /** Set on the link to the page being viewed (site paths only). */
  ariaCurrent?: "page";
  children: ReactNode;
  /** Suppress the external-link icon (image links, the logo, icon-only links). */
  iconless?: boolean;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  tabIndex?: number;
};

/**
 * The one link component for hrefs that may be internal or external (settings,
 * database rows, navigation tables, Markdown):
 *
 * - site paths (`/join`, `/join#newsletter`) render a next/link;
 * - http(s) URLs open in a new tab (`rel="noopener"`), show a small "opens in a new tab"
 *   icon and carry a visually hidden "(opens in a new tab)" note for screen readers;
 * - `mailto:`, `tel:`, `#anchor` and the like render a plain `<a>`.
 *
 * Static links whose kind is known can keep using `<Link>` or `<a>` directly.
 */
export function SmartLink({ href, className, ariaCurrent, children, iconless, ...rest }: Props) {
  if (isExternalUrl(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener" {...rest}>
        {children}
        {iconless ? null : <ExternalLinkIcon className="ml-1 inline-block h-[0.8em] w-[0.8em] align-[-0.05em]" />}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  if (isSitePath(href)) {
    return (
      <Link href={href} className={className} aria-current={ariaCurrent} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}
