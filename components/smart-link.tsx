import Link from "next/link";
import type { ReactNode } from "react";
import { isExternalUrl, isSitePath } from "@/lib/urls";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

/**
 * The one link component for hrefs that may be internal or external (settings,
 * database rows, navigation tables, Markdown):
 *
 * - site paths (`/join`, `/join#newsletter`) render a next/link;
 * - http(s) URLs open in a new tab (`rel="noopener"`) and carry a visually hidden
 *   "(opens in a new tab)" note for screen readers;
 * - `mailto:`, `tel:`, `#anchor` and the like render a plain `<a>`.
 *
 * Static links whose kind is known can keep using `<Link>` or `<a>` directly.
 */
export function SmartLink({ href, className, children }: Props) {
  if (isExternalUrl(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener">
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  if (isSitePath(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
