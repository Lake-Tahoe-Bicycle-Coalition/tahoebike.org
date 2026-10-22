"use client";

import { useEffect, useRef } from "react";

const MESSAGE = "You have unsaved changes on this page. Leave without saving?";

/**
 * Warns before leaving an admin form that has unsaved edits. Render it anywhere inside the
 * <form>: it finds its form, and after the first edit (any input or change event) it asks
 * for confirmation on a reload, a tab close, or a click on any link that leaves the page,
 * including the admin's own navigation and Cancel buttons. Saving is never blocked: a
 * successful save redirects without asking.
 *
 * Not covered: the browser's Back button inside the app (Next gives no hook to cancel it).
 */
export function UnsavedChangesGuard() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = marker.current?.closest("form");
    if (!form) return;
    let dirty = false;

    const markDirty = () => {
      dirty = true;
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    // Capture phase on the document runs before Next's <Link> handler, so cancelling here
    // stops the client-side navigation as well as a plain page load.
    const onClick = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // new tab/window
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      const here = new URL(window.location.href);
      if (destination.pathname === here.pathname && destination.search === here.search) return; // same page / anchor
      if (!window.confirm(MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return <span ref={marker} hidden />;
}
