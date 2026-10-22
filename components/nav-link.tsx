"use client";

import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { SmartLink } from "@/components/smart-link";
import type { NavLink as NavLinkData } from "@/lib/navigation";
import { isSitePath } from "@/lib/urls";

/**
 * A thin bar under a clicked header link while its page loads. Pages are usually prefetched,
 * so this rarely shows; it covers the slow case (a page not yet prefetched, a slow connection)
 * where a click would otherwise give no feedback. Always rendered at a fixed size and only
 * faded in after 100ms, so it never shifts the layout or flickers on fast navigations.
 * Must render inside the <Link> it reports on.
 */
function PendingHint() {
  const { pending } = useLinkStatus();
  return (
    // Outer span: the delayed fade. Inner span: the pulse (an animation on the outer span
    // would override its opacity and skip the delay).
    <span
      aria-hidden
      data-pending={pending ? "true" : undefined}
      className="group pointer-events-none absolute inset-x-3 bottom-1 h-0.5 opacity-0 transition-opacity duration-150 data-pending:opacity-100 data-pending:delay-100"
    >
      <span className="block h-full rounded-full bg-asphalt group-data-pending:animate-pulse" />
    </span>
  );
}

/**
 * A navigation entry that marks itself `aria-current="page"` while its page is being
 * viewed. Style the current state with the `aria-[current=page]:` variant; a menu whose
 * dropdown holds the current page can match `:has([aria-current=page])`.
 */
export function NavLink({ link, className }: { link: NavLinkData; className?: string }) {
  const pathname = usePathname();
  const internal = isSitePath(link.href);
  return (
    <SmartLink
      href={link.href}
      className={internal ? `relative ${className ?? ""}` : className}
      ariaCurrent={pathname === link.href ? "page" : undefined}
    >
      {link.label}
      {internal ? <PendingHint /> : null}
    </SmartLink>
  );
}
