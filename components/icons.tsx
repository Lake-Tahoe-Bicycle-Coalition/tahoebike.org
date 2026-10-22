import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Shared defaults: decorative, sized by the caller's className, colored by currentColor. */
function base(props: IconProps): IconProps {
  return { "aria-hidden": true, focusable: false, ...props } as IconProps;
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...base(props)}
    >
      <path d="M12.5 9v3.5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1H7" />
      <path d="M10 2.5h3.5V6M13.5 2.5 7.5 8.5" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...base(props)}
    >
      <path d="m3.5 6 4.5 4.5L12.5 6" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...base(props)}>
      <path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.7V13h2.7v8h3.1Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...base(props)}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      {...base(props)}
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      {...base(props)}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function BikeIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 48 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...base(props)}
    >
      <circle cx="9" cy="22" r="7" />
      <circle cx="39" cy="22" r="7" />
      <path d="M9 22 18 8h12l9 14M18 8l6 14h-15M24 22l6-14M15 5h6M29 5h5l-4 3" />
    </svg>
  );
}
