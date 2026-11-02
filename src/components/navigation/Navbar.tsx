"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/animations/gsap";
import { lockScroll } from "@/lib/animations/lenis";
import { prefersReducedMotion } from "@/lib/animations/utils";
import { NAV_ITEMS } from "@/lib/site";
import { cn } from "@/lib/utils/cn";
import type { MediaImage, SocialLink } from "@/types/content";
import { MobileMenu } from "./MobileMenu";

type NavbarProps = {
  churchName: string;
  ministryName?: string;
  logo?: MediaImage;
  socialLinks: SocialLink[];
  contactEmail?: string;
};

const MENU_ID = "mobile-menu";
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const DESKTOP_LINKS = NAV_ITEMS.filter((item) => item.href !== "/give");

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Global header: a floating frosted-glass bar (iOS material).
 * - ≥1280px: inline links with a pill indicator that glides between them.
 * - <1280px: menu button opening <MobileMenu />.
 * - Hides while scrolling down, reappears when scrolling up or on focus.
 */
export function Navbar({ churchName, ministryName, logo, socialLinks, contactEmail }: NavbarProps) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useGSAP(
    () => {
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => setHidden(self.direction === 1 && self.scroll() > 320),
      });
    },
    { scope: headerRef },
  );

  /** Glide the pill indicator to a link (or to the active link). Called from events/effects only. */
  const moveIndicator = (target?: HTMLElement | null) => {
    const indicator = indicatorRef.current;
    const nav = navRef.current;
    const link = target ?? nav?.querySelector<HTMLElement>("[aria-current='page']");
    if (!indicator) return;
    if (!link) {
      gsap.to(indicator, { opacity: 0, duration: 0.25 });
      return;
    }
    gsap.to(indicator, {
      x: link.offsetLeft,
      width: link.offsetWidth,
      opacity: 1,
      duration: prefersReducedMotion() ? 0 : 0.55,
      ease: "expo.out",
    });
  };

  // Keep the indicator on the current page after navigation.
  useGSAP(() => moveIndicator(), { dependencies: [pathname], scope: headerRef });

  // While the menu is open: lock scrolling and make the page behind it inert.
  useEffect(() => {
    lockScroll(open);
    const background = document.querySelectorAll<HTMLElement>("#main-content, #site-footer");
    background.forEach((element) => (element.inert = open));
    return () => {
      lockScroll(false);
      background.forEach((element) => (element.inert = false));
    };
  }, [open]);

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  };

  // Escape closes the menu; Tab stays within the header while it is open.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!open) return;
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab" || !headerRef.current) return;
    const focusable = Array.from(headerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null && !element.closest("[inert]"),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <header
      ref={headerRef}
      onKeyDown={onKeyDown}
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "fixed inset-x-0 top-0 z-50 pt-3 transition-transform duration-700 ease-out-expo md:pt-4",
        hidden && !open && "-translate-y-[120%]",
      )}
    >
      <div className="container-site relative z-50">
        <div
          className={cn(
            "surface-dark flex h-14 items-center justify-between gap-4 rounded-full pr-2 pl-3 transition-[background-color,box-shadow] duration-500 md:h-16 md:pl-4",
            open ? "border border-transparent bg-transparent" : "material-dark shadow-float",
          )}
        >
          <Logo churchName={churchName} ministryName={ministryName} logo={logo} />

          <nav aria-label="Main" className="hidden xl:block">
            <ul
              ref={navRef}
              className="relative flex items-center"
              onMouseLeave={() => moveIndicator()}
            >
              <span
                ref={indicatorRef}
                aria-hidden="true"
                className="absolute top-0 left-0 h-full w-0 rounded-full bg-white/12 opacity-0"
              />
              {DESKTOP_LINKS.map((item) => (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    onMouseEnter={(event) => moveIndicator(event.currentTarget)}
                    onFocus={(event) => moveIndicator(event.currentTarget)}
                    className="block rounded-full px-4 py-2 text-sm font-medium text-white/75 transition-colors duration-300 hover:text-white aria-[current=page]:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button href="/give" variant="white" size="md" className="hidden h-10! sm:inline-flex" magnetic>
              Give
            </Button>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls={MENU_ID}
              className="relative grid size-10 place-items-center rounded-full bg-white/10 text-white transition-[background-color,scale] duration-300 hover:bg-white/20 active:scale-90 xl:hidden"
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <span aria-hidden="true" className="relative block h-2.5 w-4">
                <span
                  className={cn(
                    "absolute left-0 h-[1.5px] w-full rounded-full bg-current transition-transform duration-500 ease-out-expo",
                    open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 h-[1.5px] w-full rounded-full bg-current transition-transform duration-500 ease-out-expo",
                    open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      <MobileMenu
        id={MENU_ID}
        open={open}
        items={NAV_ITEMS}
        pathname={pathname}
        socialLinks={socialLinks}
        contactEmail={contactEmail}
        onNavigate={() => close(false)}
      />
    </header>
  );
}
