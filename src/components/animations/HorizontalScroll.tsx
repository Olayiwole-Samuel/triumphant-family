"use client";

import { useRef, type ReactNode } from "react";
import { EASE, SCRUB } from "@/lib/animations/constants";
import { gsap } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";
import { cn } from "@/lib/utils/cn";

type HorizontalScrollProps = {
  children: ReactNode;
  className?: string;
  /** Classes for the moving row (gap, padding). */
  trackClassName?: string;
  /** Accessible name for the scrollable region. */
  label: string;
};

/**
 * Desktop: pins the section and converts vertical scroll into horizontal
 * movement of the track.
 * Mobile / reduced motion: a native horizontally-swipeable row with snapping
 * (no pinning), which is the more natural pattern on touch screens.
 */
export function HorizontalScroll({
  children,
  className,
  trackClassName,
  label,
}: HorizontalScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useMotion(
    ({ isDesktop }, root) => {
      if (!isDesktop) return;
      const viewport = root.querySelector<HTMLElement>("[data-hscroll-viewport]");
      const track = root.querySelector<HTMLElement>("[data-hscroll-track]");
      if (!viewport || !track) return;

      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      if (distance() === 0) return;

      gsap.set(viewport, { overflow: "visible" });
      const move = gsap.to(track, {
        x: () => -distance(),
        ease: EASE.none,
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: SCRUB.cinematic,
          invalidateOnRefresh: true,
        },
      });

      // Images marked [data-hscroll-parallax] drift inside their frames as the row moves.
      gsap.utils.toArray<HTMLElement>("[data-hscroll-parallax]", root).forEach((image) => {
        gsap.fromTo(
          image,
          { xPercent: -8, scale: 1.18 },
          {
            xPercent: 8,
            ease: EASE.none,
            scrollTrigger: {
              trigger: image,
              containerAnimation: move,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <div
        data-hscroll-viewport
        role="region"
        aria-label={label}
        tabIndex={0}
        className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div data-hscroll-track className={cn("flex w-max", trackClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
