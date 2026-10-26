/** Primary navigation. Mirrors the WordPress "Primary" menu tree. */
/** `href` is a site path or an external URL; SmartLink opens external ones in a new tab. */
export type NavLink = { label: string; href: string };
export type NavItem = NavLink & {
  children?: NavLink[];
  /** Label for a link to the parent page inside its dropdown, when the parent is a real index page. */
  indexLabel?: string;
  /** Render as a call-to-action button in the desktop header. */
  emphasis?: true;
};

export const primaryNav: NavItem[] = [
  { label: "Join", href: "/join" },
  { label: "Volunteer", href: "/volunteer" },
  {
    label: "Programs",
    href: "/programs",
    indexLabel: "All Programs",
    children: [
      { label: "Tahoe Bike Month", href: "https://www.tahoebikemonth.org/" },
      { label: "Interactive Bike Map", href: "https://map.tahoebike.org/" },
      { label: "Printable Bike Map", href: "/print-bike-map" },
      { label: "Bike Kitchen", href: "/bike-kitchen" },
      { label: "Bike Racks", href: "/bike-racks" },
      { label: "Bike Valet", href: "/bike-valet" },
      { label: "Bike Safety", href: "/bike-safety" },
      { label: "Advocacy", href: "/advocacy" },
    ],
  },
  {
    label: "About",
    href: "/about",
    // About is the index page here, so it is the indexLabel rather than a child: the phone
    // menu already links the "About" heading to /about, and a child would list it twice.
    indexLabel: "About",
    children: [
      { label: "Newsletter", href: "/newsletter" },
      { label: "Contact", href: "/contact" },
    ],
  },
  { label: "Donate", href: "/join#donate", emphasis: true },
];

/** Footer link columns (the organization column is built in SiteFooter). */
export const footerColumns: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Programs",
    links: [
      { label: "Bike Kitchen", href: "/bike-kitchen" },
      { label: "Bike Valet", href: "/bike-valet" },
      { label: "Bike Racks", href: "/bike-racks" },
      { label: "Bike Safety", href: "/bike-safety" },
      { label: "Advocacy", href: "/advocacy" },
      { label: "Tahoe Bike Month", href: "https://www.tahoebikemonth.org/" },
    ],
  },
  {
    heading: "Get Involved",
    links: [
      { label: "Join", href: "/join" },
      { label: "Donate", href: "/join#donate" },
      { label: "Volunteer", href: "/volunteer" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Interactive Bike Map", href: "https://map.tahoebike.org/" },
      { label: "Printable Bike Map", href: "/print-bike-map" },
      { label: "About / Board of Directors", href: "/about" },
    ],
  },
];

/** Every public page path, used by the sitemap. */
export const publicPaths = [
  "/",
  "/join",
  "/volunteer",
  "/programs",
  "/bike-kitchen",
  "/bike-valet",
  "/bike-racks",
  "/bike-safety",
  "/advocacy",
  "/print-bike-map",
  "/about",
  "/newsletter",
  "/contact",
  "/privacy-policy",
] as const;
