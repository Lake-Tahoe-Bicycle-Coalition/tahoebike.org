"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type AdminNavItem = { href: string; label: string; badge?: number };

/**
 * Section navigation for /admin. The console layout supplies the items (and the
 * unread-submissions badge); this component only highlights the current section.
 */
export function AdminNav({ items, account }: { items: AdminNavItem[]; account: ReactNode }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex flex-wrap items-center justify-between gap-4 border-b border-asphalt/15 pb-4">
      <ul className="flex flex-wrap gap-x-1 gap-y-2">
        {items.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded px-3 py-1.5 font-semibold no-underline ${
                  active ? "bg-asphalt text-white" : "text-asphalt hover:bg-asphalt/10"
                }`}
              >
                {item.label}
                {item.badge ? (
                  <span
                    className={`rounded-full px-2 text-xs font-bold ${active ? "bg-safety text-asphalt" : "bg-tahoe-deep text-white"}`}
                    aria-label={`${item.badge} new`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-4 text-sm">{account}</div>
    </nav>
  );
}
