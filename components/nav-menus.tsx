"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Progressive enhancement for the `<details>`-based navigation menus.
 *
 * Native `<details>` only toggles from its own `<summary>`, so without this an
 * open dropdown stays open until the visitor clicks the same heading again.
 * With JavaScript, open menus also close on a click or tap outside them, on
 * Escape, when focus leaves them, and when a sibling menu is opened. Without
 * JavaScript the menus still work as plain `<details>`.
 */
export function NavMenus({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;

    const openMenus = () => Array.from(nav.querySelectorAll<HTMLDetailsElement>("details[open]"));

    const closeAll = (except?: HTMLDetailsElement) => {
      for (const menu of openMenus()) {
        if (menu !== except) menu.open = false;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const inside = openMenus().find((menu) => menu.contains(target));
      // Clicking inside one menu (or its summary) closes only the other menus.
      closeAll(inside);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const [first] = openMenus();
      if (!first) return;
      closeAll();
      // Return focus to the heading of the menu that was open.
      first.querySelector<HTMLElement>("summary")?.focus();
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const inside = openMenus().find((menu) => menu.contains(target));
      closeAll(inside);
    };

    // Opening one menu closes the others (fires after the click has toggled it).
    const onToggle = (event: Event) => {
      const menu = event.target;
      if (menu instanceof HTMLDetailsElement && menu.open) closeAll(menu);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    nav.addEventListener("toggle", onToggle, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      nav.removeEventListener("toggle", onToggle, true);
    };
  }, []);

  return (
    <nav ref={ref} aria-label="Primary" className={className}>
      {children}
    </nav>
  );
}
