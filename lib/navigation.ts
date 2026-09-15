/** Primary navigation. Mirrors the WordPress "Primary" menu tree. */
export type NavLink = { label: string; href: string; external?: boolean };
export type NavItem = NavLink & {
  children?: NavLink[];
  /** Label for a link to the parent page inside its dropdown, when the parent is a real index page. */
  indexLabel?: string;
};

export const primaryNav: NavItem[] = [
  { label: "Join", href: "/join" },
  { label: "Volunteer", href: "/volunteer" },
  {
    label: "Programs",
    href: "/programs",
    indexLabel: "All programs",
    children: [
      { label: "Tahoe Bike Month", href: "https://www.tahoebikemonth.org/", external: true },
      { label: "Interactive Bike Map", href: "https://map.tahoebike.org/", external: true },
      { label: "Printable Bike Map", href: "/print-bike-map" },
      { label: "Bike Kitchen", href: "/programs/bike-kitchen" },
      { label: "Bike Racks", href: "/bike-racks" },
      { label: "Bike Valet", href: "/programs/bike-valet" },
      { label: "Bike Safety", href: "/bike-safety" },
      { label: "Advocacy", href: "/advocacy" },
    ],
  },
  {
    label: "Learn More",
    href: "/about",
    children: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/** Footer link columns. Mirrors the WordPress footer layout. */
export const footerColumns: { heading: string; links: NavLink[] }[] = [
  {
    heading: "About",
    links: [
      { label: "Home", href: "/" },
      { label: "Board of Directors", href: "/about" },
      { label: "Programs", href: "/programs" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Interactive Bike Map", href: "https://map.tahoebike.org/", external: true },
      { label: "Bike Month", href: "https://www.tahoebikemonth.org/", external: true },
      { label: "Bike Safety", href: "/bike-safety" },
      { label: "Bike Valet", href: "/programs/bike-valet" },
    ],
  },
  {
    heading: "Get Involved",
    links: [
      { label: "Join Us", href: "/join" },
      { label: "Volunteer", href: "/volunteer" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

/** Every public page path, used by the sitemap. */
export const publicPaths = [
  "/",
  "/join",
  "/volunteer",
  "/programs",
  "/programs/bike-kitchen",
  "/programs/bike-valet",
  "/bike-racks",
  "/bike-safety",
  "/advocacy",
  "/print-bike-map",
  "/about",
  "/contact",
] as const;
