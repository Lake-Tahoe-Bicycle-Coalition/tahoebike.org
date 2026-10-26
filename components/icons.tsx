import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Shared defaults: decorative, sized by the caller's className, colored by currentColor. */
function base(props: IconProps): IconProps {
  return { "aria-hidden": true, focusable: false, ...props } as IconProps;
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
