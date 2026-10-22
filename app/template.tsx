import { ViewTransition } from "react";

/**
 * Page transitions. A template (unlike the layout) mounts fresh on every navigation, so the
 * outgoing page gets the `page-exit` animation and the incoming one `page-enter`; the CSS
 * lives in app/globals.css. Anything that is not a navigation (a refresh, a revalidation)
 * animates nothing. Browsers without the View Transitions API simply swap pages.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
