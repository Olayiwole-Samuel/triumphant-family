"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { DURATION, EASE, START } from "@/lib/animations/constants";
import { gsap } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Vertical travel in px on desktop (halved on mobile). */
  y?: number;
  delay?: number;
  duration?: number;
  /** "scroll" (default) waits until in view; "load" plays immediately. */
  trigger?: "scroll" | "load";
};

/** Fades and lifts its content into place. The workhorse entrance animation. */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  y = 48,
  delay = 0,
  duration = DURATION.slow,
  trigger = "scroll",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useMotion(
    ({ isDesktop }, root) => {
      gsap.fromTo(
        root,
        { opacity: 0, y: isDesktop ? y : y / 2 },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: EASE.expo,
          scrollTrigger:
            trigger === "scroll" ? { trigger: root, start: START.reveal, once: true } : undefined,
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} data-animate className={className}>
      {children}
    </Tag>
  );
}
