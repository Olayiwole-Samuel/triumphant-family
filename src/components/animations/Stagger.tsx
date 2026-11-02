"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { DURATION, EASE, STAGGER, START } from "@/lib/animations/constants";
import { gsap } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";

type StaggerProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  y?: number;
  stagger?: number;
  delay?: number;
  /** "rise" (default) or "tilt": items swing up from a 3D tilt, like cards being dealt. */
  variant?: "rise" | "tilt";
};

/**
 * Reveals each DIRECT child in sequence when the group scrolls into view.
 * Use for card grids, lists and rows. Wrap lists with `as="ul"`.
 */
export function Stagger({
  children,
  as: Tag = "div",
  className,
  y = 56,
  stagger = STAGGER.items,
  delay = 0,
  variant = "rise",
}: StaggerProps) {
  const ref = useRef<HTMLElement>(null);

  useMotion(
    ({ isDesktop }, root) => {
      gsap.fromTo(
        root.children,
        variant === "tilt"
          ? {
              opacity: 0,
              y: isDesktop ? y * 1.4 : y / 2,
              rotationX: isDesktop ? -28 : -12,
              transformOrigin: "50% 0%",
              transformPerspective: 1200,
            }
          : { opacity: 0, y: isDesktop ? y : y / 2 },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: DURATION.slow,
          ease: EASE.expo,
          delay,
          stagger,
          scrollTrigger: { trigger: root, start: START.reveal, once: true },
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} data-stagger className={className}>
      {children}
    </Tag>
  );
}
