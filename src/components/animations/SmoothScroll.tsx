"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations/gsap";
import { setLenis } from "@/lib/animations/lenis";

/**
 * The one global scroll system: a single Lenis instance driven by GSAP's
 * ticker, so Lenis and ScrollTrigger always agree on the scroll position.
 *
 * - Mounted once in the site layout. Never create Lenis anywhere else; use
 *   the helpers in src/lib/animations/lenis.ts.
 * - Lenis honours prefers-reduced-motion itself (smoothing is disabled and
 *   programmatic scrolls jump instantly).
 * - Native scrollbars, keyboard scrolling and find-in-page keep working.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,
      anchors: { offset: -96 },
      stopInertiaOnNavigate: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(lenis);

    // Tells the no-JS failsafe in the root layout that animations are live.
    document.documentElement.dataset.motionReady = "true";

    // Fonts change text metrics, which moves trigger positions.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // New page content = new layout. Recalculate trigger positions.
  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return children;
}
