"use client";

import { useRef, type ReactNode } from "react";
import { EASE } from "@/lib/animations/constants";
import { gsap } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";

/**
 * Signature hero move. The media card enters with a rounded wipe; then, on
 * desktop, the section pins and the card EXPANDS to full-bleed as you scroll —
 * corners squaring off, the photo settling from a zoom, the overlay fading in.
 *
 * Mobile / reduced motion: a static rounded card (no pinning).
 * Targets inside: [data-media-frame], [data-media-inner], [data-media-overlay].
 */
export function HeroMedia({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useMotion(
    ({ isDesktop }, root) => {
      const frame = root.querySelector<HTMLElement>("[data-media-frame]");
      const inner = root.querySelector<HTMLElement>("[data-media-inner]");
      const overlay = root.querySelector<HTMLElement>("[data-media-overlay]");
      if (!frame || !inner) return;

      const resting = isDesktop ? "inset(0% 7% 0% 7% round 36px)" : "inset(0% 0% 0% 0% round 28px)";

      // Entrance: rise up from below with a rounded wipe.
      gsap
        .timeline({ delay: 0.7, defaults: { ease: EASE.expo, duration: 1.8 } })
        .set(frame, { opacity: 1 })
        .fromTo(frame, { clipPath: "inset(100% 7% 0% 7% round 36px)" }, { clipPath: resting })
        .fromTo(inner, { scale: 1.35 }, { scale: 1.15, duration: 2.4 }, 0);

      if (!isDesktop) {
        gsap.set(inner, { scale: 1 });
        return;
      }

      // Scroll: expand to full-bleed.
      const expand = gsap.timeline({
        defaults: { ease: EASE.none },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=90%",
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
        },
      });
      expand
        .fromTo(frame, { clipPath: resting }, { clipPath: "inset(0% 0% 0% 0% round 0px)", immediateRender: false })
        .to(inner, { scale: 1 }, 0);
      if (overlay) expand.fromTo(overlay, { opacity: 0, y: 40 }, { opacity: 1, y: 0 }, 0.35);
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative h-[78svh] min-h-[28rem] w-full lg:h-svh">
      {children}
    </div>
  );
}
