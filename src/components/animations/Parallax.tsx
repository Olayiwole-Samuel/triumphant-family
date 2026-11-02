"use client";

import { useRef, type ReactNode } from "react";
import { EASE, SCRUB } from "@/lib/animations/constants";
import { gsap } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /**
   * How far the content drifts relative to the scroll, as a % of its own
   * height. Positive = moves up slower than the page (feels further away).
   * Keep between -30 and 30 for restraint. Halved on mobile.
   */
  speed?: number;
  /** Optional rotation (degrees) across the scroll range — for decorative shapes. */
  rotate?: number;
};

/** Scroll-linked depth. Animates transform only, so it stays on the GPU. */
export function Parallax({ children, className, speed = 12, rotate = 0 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useMotion(
    ({ isDesktop }, root) => {
      const amount = isDesktop ? speed : speed / 2;
      gsap.fromTo(
        root,
        { yPercent: -amount, rotate: -rotate / 2 },
        {
          yPercent: amount,
          rotate: rotate / 2,
          ease: EASE.none,
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            scrub: SCRUB.direct,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
