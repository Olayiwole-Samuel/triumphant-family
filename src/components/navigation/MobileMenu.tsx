"use client";

import Link from "next/link";
import { useRef } from "react";
import { SocialIcon, SOCIAL_LABELS } from "@/components/ui/Icon";
import { DURATION, EASE } from "@/lib/animations/constants";
import { gsap, useGSAP } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/utils";
import type { NavItem } from "@/lib/site";
import type { SocialLink } from "@/types/content";

type MobileMenuProps = {
  id: string;
  open: boolean;
  items: NavItem[];
  pathname: string;
  socialLinks: SocialLink[];
  contactEmail?: string;
  onNavigate: () => void;
};

/**
 * Full-screen navigation for phones and tablets.
 * Opening: the panel blooms out of the menu button (circular clip), then
 * links flip up in sequence.
 * Closing: the same timeline plays in reverse, faster.
 * Reduced motion: opens and closes instantly. Without animation the panel is
 * still fully functional (it is just shown/hidden).
 */
export function MobileMenu({
  id,
  open,
  items,
  pathname,
  socialLinks,
  contactEmail,
  onNavigate,
}: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  // Build the timeline once.
  useGSAP(
    () => {
      timeline.current = gsap
        .timeline({ paused: true, defaults: { ease: EASE.inOut } })
        .set(panelRef.current, { visibility: "visible" })
        .fromTo(
          panelRef.current,
          { clipPath: "circle(0% at 90% 44px)" },
          { clipPath: "circle(150% at 90% 44px)", duration: 0.9 },
        )
        .fromTo(
          "[data-menu-link]",
          { yPercent: 110, rotationX: -70, transformOrigin: "50% 100%", transformPerspective: 800 },
          { yPercent: 0, rotationX: 0, duration: DURATION.slow, ease: EASE.expo, stagger: 0.05 },
          "-=0.35",
        )
        .fromTo("[data-menu-meta]", { opacity: 0 }, { opacity: 1, duration: 0.6 }, "-=0.8");
    },
    { scope: panelRef },
  );

  // Play / reverse when `open` changes.
  useGSAP(
    () => {
      const tl = timeline.current;
      if (!tl) return;
      if (prefersReducedMotion()) {
        tl.progress(open ? 1 : 0).pause();
        return;
      }
      if (open) tl.timeScale(1).play();
      else tl.timeScale(1.8).reverse();
    },
    { dependencies: [open] },
  );

  return (
    <div
      ref={panelRef}
      id={id}
      inert={!open}
      className="surface-dark invisible fixed inset-0 z-40 flex flex-col overflow-y-auto bg-plum-950 pt-28 pb-10 xl:hidden"
      data-lenis-prevent
    >
      <nav aria-label="Main" className="container-site flex-1">
        <ul className="flex flex-col">
          {items.map((item, index) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href} className="overflow-hidden">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  data-menu-link
                  className="group flex items-baseline gap-4 py-2 text-[clamp(2.25rem,10vw,3.75rem)] leading-[1.05] font-bold tracking-[-0.045em]"
                >
                  <span className="w-7 text-xs font-semibold tracking-normal text-plum-400 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={
                      active
                        ? "text-white"
                        : "text-white/55 transition-colors duration-300 group-hover:text-white"
                    }
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div data-menu-meta className="container-site mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
        {contactEmail && (
          <a href={`mailto:${contactEmail}`} className="text-sm text-white/70 hover:text-white">
            {contactEmail}
          </a>
        )}
        <ul className="flex gap-2">
          {socialLinks.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.label || SOCIAL_LABELS[link.platform]} (opens in a new tab)`}
                className="grid size-11 place-items-center rounded-full bg-white/10 transition-[background-color,scale] hover:bg-white/20 active:scale-90"
              >
                <SocialIcon platform={link.platform} size={18} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
