"use client";

import { useRef, type ElementType } from "react";
import { DURATION, EASE, SCRUB, STAGGER, START } from "@/lib/animations/constants";
import { gsap, SplitText as GSAPSplitText } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";

type SplitTextProps = {
  children: string;
  as?: ElementType;
  className?: string;
  /**
   * - "lines": each line flips up out of a mask, in 3D (headlines)
   * - "words-scrub": words brighten one by one as you scroll (statements)
   */
  variant?: "lines" | "words-scrub";
  trigger?: "scroll" | "load";
  delay?: number;
};

/**
 * Typography animation built on GSAP's SplitText plugin.
 *
 * Accessibility: SplitText adds an aria-label with the full sentence and hides
 * the split fragments from screen readers (`aria: "auto"`). `autoSplit`
 * re-splits when fonts load or the width changes, so lines never break oddly.
 */
export function SplitText({
  children,
  as: Tag = "p",
  className,
  variant = "lines",
  trigger = "scroll",
  delay = 0,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);

  useMotion(
    (_media, root) => {
      gsap.set(root, { opacity: 1 });

      if (variant === "words-scrub") {
        GSAPSplitText.create(root, {
          type: "words",
          aria: "auto",
          autoSplit: true,
          onSplit: (self) =>
            gsap.fromTo(
              self.words,
              { opacity: 0.16 },
              {
                opacity: 1,
                ease: EASE.none,
                stagger: STAGGER.words,
                scrollTrigger: {
                  trigger: root,
                  start: "top 80%",
                  end: "bottom 45%",
                  scrub: SCRUB.soft,
                },
              },
            ),
        });
        return;
      }

      GSAPSplitText.create(root, {
        type: "lines",
        mask: "lines",
        aria: "auto",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            rotationX: -55,
            transformOrigin: "50% 100%",
            transformPerspective: 900,
            duration: DURATION.cinematic,
            ease: EASE.expo,
            stagger: STAGGER.lines,
            delay,
            scrollTrigger:
              trigger === "scroll" ? { trigger: root, start: START.reveal, once: true } : undefined,
          }),
      });
    },
    { scope: ref, dependencies: [children] },
  );

  return (
    <Tag ref={ref} data-animate className={className}>
      {children}
    </Tag>
  );
}
