import Image from "next/image";
import Link from "next/link";
import { ChevronIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { NavLink } from "@/components/nav-link";
import { NavMenus } from "@/components/nav-menus";
import { primaryNav } from "@/lib/navigation";

/**
 * The link to the page being viewed gets a solid yellow background (NavLink sets aria-current).
 * Tap targets are at least 44px tall (min-h-11).
 */
const linkClass =
  "flex min-h-11 items-center rounded px-3 py-2 text-asphalt no-underline hover:bg-safety/40 aria-[current=page]:bg-safety";
/** A desktop menu heading whose dropdown holds the current page is marked the same way. */
const currentSectionClass = "group-has-[[aria-current=page]]:bg-safety";

export function SiteHeader() {
  return (
    // A named view transition with no animation keeps the header perfectly still while the
    // page content changes (see ::view-transition-*(site-header) in app/globals.css).
    // Sticky on desktop only (md and up): on a phone the header is ~157px tall and would take a
    // fifth of the screen. In-page anchors get a matching scroll-padding-top in app/globals.css.
    <header
      className="border-b-4 border-safety bg-white md:sticky md:top-0 md:z-30"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 py-3 md:flex-nowrap md:py-1">
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
              <MenuIcon width={24} height={24} className="group-open:hidden" />
              <CloseIcon width={24} height={24} className="hidden group-open:block" />
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
                    <summary className={`${linkClass} ${currentSectionClass} cursor-pointer list-none gap-1 font-bold`}>
                      {item.label}
                      <ChevronIcon className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
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
                  <NavLink link={item} className="btn btn-primary min-h-11 px-4 py-1.5" />
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
