"use client";

import { usePathname } from "next/navigation";
import { SmartLink } from "@/components/smart-link";
import type { NavLink as NavLinkData } from "@/lib/navigation";

/**
 * A navigation entry that marks itself `aria-current="page"` while its page is being
 * viewed. Style the current state with the `aria-[current=page]:` variant; a menu whose
 * dropdown holds the current page can match `:has([aria-current=page])`.
 */
export function NavLink({ link, className }: { link: NavLinkData; className?: string }) {
  const pathname = usePathname();
  return (
    <SmartLink
      href={link.href}
      className={className}
      ariaCurrent={pathname === link.href ? "page" : undefined}
    >
      {link.label}
    </SmartLink>
  );
}
