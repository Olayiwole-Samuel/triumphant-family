"use client";

import { useRef } from "react";
import { Gleam } from "@/components/ui/Gleam";
import { gsap, ScrollTrigger } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";
import { cn } from "@/lib/utils/cn";

type MarqueeProps = {
  items: string[];
  className?: string;
  /** Seconds for one full loop at rest. */
  duration?: number;
};

/**
 * Infinite ticker that reacts to scroll: it speeds up and leans (skew) with
 * scroll velocity, follows scroll direction, then eases back to its idle pace.
 * Decorative (aria-hidden) — the same words appear elsewhere as real content.
 * Reduced motion: a still row of words.
 */
export function Marquee({ items, className, duration = 40 }: MarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useMotion(
    (_media, root) => {
      const track = root.querySelector<HTMLElement>("[data-marquee-track]");
      if (!track) return;

      const loop = gsap.to(track, { xPercent: -50, ease: "none", duration, repeat: -1 });
      // Start deep into the loop so reversing direction never hits time 0.
      loop.totalTime(duration * 500);

      const skewTo = gsap.quickTo(track, "skewX", { duration: 0.5, ease: "power3.out" });
      const settleSkew = gsap.delayedCall(0.15, () => skewTo(0)).pause();
      let direction = 1;

      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          direction = self.direction;
          const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(velocity) / 400);
          gsap.killTweensOf(loop);
          gsap.to(loop, {
            timeScale: boost * direction,
            duration: 0.2,
            onComplete: () => {
              gsap.to(loop, { timeScale: direction, duration: 1.2, ease: "power2.out" });
            },
          });
          skewTo(gsap.utils.clamp(-10, 10, velocity / -250));
          settleSkew.restart(true);
        },
      });
    },
    { scope: ref },
  );

  const row = (copy: number) => (
    <div className="flex shrink-0 items-center" key={copy}>
      {items.map((item, index) => (
        <span key={`${copy}-${index}`} className="flex items-center">
          <span className="px-6 md:px-10">{item}</span>
          <Gleam className="size-[0.4em] shrink-0 text-plum-400" />
        </span>
      ))}
    </div>
  );

  return (
    <div ref={ref} aria-hidden="true" className={cn("overflow-hidden whitespace-nowrap", className)}>
      <div data-marquee-track className="flex w-max will-change-transform">
        {row(0)}
        {row(1)}
      </div>
    </div>
  );
}
