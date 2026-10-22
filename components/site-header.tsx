import Image from "next/image";
import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { NavMenus } from "@/components/nav-menus";
import { primaryNav } from "@/lib/navigation";

/** The link to the page being viewed gets a solid yellow background (NavLink sets aria-current). */
const linkClass =
  "block rounded px-3 py-2 text-asphalt no-underline hover:bg-safety/40 aria-[current=page]:bg-safety";
/** A desktop menu heading whose dropdown holds the current page is marked the same way. */
const currentSectionClass = "group-has-[[aria-current=page]]:bg-safety";

export function SiteHeader() {
  return (
    <header className="border-b-4 border-safety bg-white">
      <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 py-3 md:flex-nowrap">
        <Link href="/" className="flex items-center no-underline" aria-label="Lake Tahoe Bicycle Coalition home">
          <Image
            src="/images/2024/01/LTBC-Logo-new-2024.png"
            alt="Lake Tahoe Bicycle Coalition"
            width={200}
            height={65}
            priority
          />
        </Link>

        {/* No-JavaScript-required navigation: <details> handles the mobile menu and dropdowns;
            NavMenus adds click-outside/Escape closing when JavaScript is available. On mobile the
            nav is display: contents so the menu panel wraps below the logo row at full width. */}
        <NavMenus className="contents md:block">
          <details className="group w-full md:hidden">
            <summary
              aria-label="Menu"
              className="absolute right-4 top-[22px] flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded border-2 border-asphalt text-asphalt hover:bg-safety/40 [&::-webkit-details-marker]:hidden"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path className="group-open:hidden" d="M4 6h16M4 12h16M4 18h16" />
                <path className="hidden group-open:inline" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </summary>
            <ul className="mt-2 space-y-1 border-t border-asphalt/10 pt-2">
              {primaryNav.map((item) => (
                <li key={item.label}>
                  <NavLink link={item} className={`${linkClass} font-bold`} />
                  {item.children ? (
                    <ul className="ml-4">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <NavLink link={child} className={linkClass} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>

          <ul className="hidden items-center gap-1 md:flex">
            {primaryNav.map((item) =>
              item.children ? (
                <li key={item.label} className="relative">
                  <details className="group">
                    <summary className={`${linkClass} ${currentSectionClass} cursor-pointer list-none font-bold`}>
                      {item.label}
                      <span aria-hidden="true"> ▾</span>
                    </summary>
                    <ul className="absolute right-0 z-20 mt-1 min-w-56 rounded border border-asphalt/10 bg-white p-2 shadow-lg">
                      {item.indexLabel ? (
                        <li>
                          <NavLink link={{ label: item.indexLabel, href: item.href }} className={linkClass} />
                        </li>
                      ) : null}
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <NavLink link={child} className={linkClass} />
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ) : item.emphasis ? (
                <li key={item.label} className="ml-2">
                  <NavAnchor link={item} className="btn btn-primary px-4 py-1.5" />
                </li>
              ) : (
                <li key={item.label}>
                  <NavLink link={item} className={`${linkClass} font-bold`} />
                </li>
              ),
            )}
          </ul>
        </NavMenus>
      </div>
    </header>
  );
}
