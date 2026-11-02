"use client";

import { useRef, type ReactNode } from "react";
import { DURATION, EASE, START } from "@/lib/animations/constants";
import { gsap } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";
import { cn } from "@/lib/utils/cn";

type ImageRevealProps = {
  children: ReactNode;
  className?: string;
  /** Edge the image is uncovered from. */
  from?: "bottom" | "top" | "left" | "right";
  trigger?: "scroll" | "load";
  delay?: number;
};

const CLIP_FROM = {
  bottom: "inset(100% 0% 0% 0% round 32px)",
  top: "inset(0% 0% 100% 0% round 32px)",
  left: "inset(0% 100% 0% 0% round 32px)",
  right: "inset(0% 0% 0% 100% round 32px)",
} as const;

const CLIP_TO = "inset(0% 0% 0% 0% round 32px)";

/**
 * Cinematic image entrance: a clip-path wipe on the frame while the image
 * inside settles from a slight zoom. Wrap any image (or MediaImage).
 */
export function ImageReveal({
  children,
  className,
  from = "bottom",
  trigger = "scroll",
  delay = 0,
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useMotion(
    (_media, root) => {
      const inner = root.firstElementChild;
      const timeline = gsap.timeline({
        delay,
        defaults: { duration: DURATION.cinematic, ease: EASE.expo },
        scrollTrigger:
          trigger === "scroll" ? { trigger: root, start: START.reveal, once: true } : undefined,
      });

      timeline
        .set(root, { opacity: 1 })
        .fromTo(root, { clipPath: CLIP_FROM[from] }, { clipPath: CLIP_TO, clearProps: "clipPath" });
      if (inner) timeline.fromTo(inner, { scale: 1.25 }, { scale: 1, duration: 2.2 }, 0);
    },
    { scope: ref },
  );

  return (
    <div ref={ref} data-animate className={cn("squircle overflow-hidden rounded-media", className)}>
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}
