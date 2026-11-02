"use client";

import { useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";
import { cn } from "@/lib/utils/cn";

/**
 * A slow-moving glow behind dark sections — soft blobs in tonal plum that
 * drift like an iOS wallpaper and lean gently toward the cursor on desktop.
 * Static (but still beautiful) with reduced motion. Transform-only animation.
 */
const BLOBS = [
  "left-[-10%] top-[-20%] size-[70vmax] bg-[radial-gradient(closest-side,rgb(123_45_94/0.85),transparent)]",
  "right-[-20%] top-[10%] size-[60vmax] bg-[radial-gradient(closest-side,rgb(151_80_123/0.45),transparent)]",
  "left-[20%] bottom-[-35%] size-[65vmax] bg-[radial-gradient(closest-side,rgb(95_33_73/0.9),transparent)]",
];

export function Aurora({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useMotion(
    ({ finePointer }, root) => {
      const blobs = gsap.utils.toArray<HTMLElement>("[data-blob]", root);
      blobs.forEach((blob, index) => {
        gsap.to(blob, {
          xPercent: gsap.utils.random(-14, 14),
          yPercent: gsap.utils.random(-12, 12),
          scale: gsap.utils.random(0.9, 1.15),
          duration: 9 + index * 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      if (!finePointer) return;
      const layer = root.querySelector<HTMLElement>("[data-aurora-layer]");
      if (!layer) return;
      const xTo = gsap.quickTo(layer, "x", { duration: 2.5, ease: "power3.out" });
      const yTo = gsap.quickTo(layer, "y", { duration: 2.5, ease: "power3.out" });
      const onMove = (event: PointerEvent) => {
        xTo((event.clientX / window.innerWidth - 0.5) * 80);
        yTo((event.clientY / window.innerHeight - 0.5) * 60);
      };
      window.addEventListener("pointermove", onMove);
      return () => window.removeEventListener("pointermove", onMove);
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div data-aurora-layer className="absolute inset-0">
        {BLOBS.map((blob) => (
          <div key={blob} data-blob className={cn("absolute rounded-full will-change-transform", blob)} />
        ))}
      </div>
      {/* Fine grain keeps large gradients from banding. */}
      <div className="grain absolute inset-0" />
    </div>
  );
}
