/**
 * Static site configuration — things that are part of the code, not content.
 * (Church details such as name, address and service times live in Sanity.)
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

export type NavItem = { label: string; href: string };

/** Main navigation, in display order. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Watch", href: "/watch" },
  { label: "Sermons", href: "/sermons" },
  { label: "Gallery", href: "/gallery" },
  { label: "Events", href: "/events" },
  { label: "Give", href: "/give" },
  { label: "Contact", href: "/contact" },
];

/** Public routes, used by the sitemap. */
export const STATIC_ROUTES = NAV_ITEMS.map((item) => item.href);
