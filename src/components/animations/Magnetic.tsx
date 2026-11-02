"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";
import { cn } from "@/lib/utils/cn";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** 0–1. How far the content follows the cursor. Keep it restrained. */
  strength?: number;
};

/**
 * Makes its content drift subtly toward the cursor. Desktop mouse/trackpad
 * only — touch and reduced-motion users get a normal, static element.
 * Purely decorative: the wrapped button works exactly the same without it.
 */
export function Magnetic({ children, className, strength = 0.25 }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useMotion(
    ({ finePointer }, root) => {
      if (!finePointer) return;
      const xTo = gsap.quickTo(root, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(root, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });

      const onMove = (event: PointerEvent) => {
        const rect = root.getBoundingClientRect();
        xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
        yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };

      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerleave", onLeave);
      return () => {
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={cn("inline-flex", className)}>
      {children}
    </span>
  );
}
