"use client";

import { useRef, type ReactNode } from "react";
import { EASE, SCRUB } from "@/lib/animations/constants";
import { gsap } from "@/lib/animations/gsap";
import { useMotion } from "@/lib/animations/useMotion";

export type StoryPanel = {
  id: string;
  label: string;
  content: ReactNode;
};

/**
 * Sticky storytelling (desktop): the section pins and each panel hands over to
 * the next as you scroll (scrub: 2 — heavy, trailing). Outgoing panels sink
 * back in 3D; incoming ones rise into place. Transform + opacity only.
 *
 * Mobile and reduced motion: panels simply stack in normal reading order —
 * the overlapping layout is only applied while the animation is active.
 */
export function StoryPanels({ panels }: { panels: StoryPanel[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useMotion(
    ({ isDesktop }, root) => {
      if (!isDesktop || panels.length < 2) return;

      const stack = root.querySelector<HTMLElement>("[data-story-stack]");
      const items = gsap.utils.toArray<HTMLElement>("[data-story-panel]", root);
      const markers = gsap.utils.toArray<HTMLElement>("[data-story-marker]", root);
      const progress = root.querySelector<HTMLElement>("[data-story-progress]");
      if (!stack) return;

      // Overlap all panels in one grid cell while animating.
      gsap.set(stack, { display: "grid", gap: 0, perspective: 1200 });
      gsap.set(items, { gridArea: "1 / 1" });
      gsap.set(items.slice(1), { opacity: 0, yPercent: 24, rotationX: -18 });
      gsap.set(markers.slice(1), { opacity: 0.35 });

      const timeline = gsap.timeline({
        defaults: { ease: EASE.none },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${window.innerHeight * (items.length - 1) * 0.9}`,
          pin: true,
          scrub: SCRUB.trailing,
          invalidateOnRefresh: true,
        },
      });

      items.forEach((item, index) => {
        if (index === 0) return;
        const at = index - 1;
        timeline
          .to(
            items[index - 1],
            { opacity: 0, yPercent: -18, rotationX: 16, scale: 0.94 },
            at,
          )
          .to(markers[index - 1], { opacity: 0.35 }, at)
          .to(item, { opacity: 1, yPercent: 0, rotationX: 0 }, at + 0.2)
          .to(markers[index], { opacity: 1 }, at + 0.2);
      });
      if (progress) {
        timeline.fromTo(progress, { scaleY: 0 }, { scaleY: 1, duration: items.length - 1 + 0.2 }, 0);
      }
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="flex min-h-svh items-center py-24">
      <div className="container-site grid w-full gap-12 lg:grid-cols-12">
        <ol className="relative hidden pl-6 lg:col-span-4 lg:block" aria-hidden="true">
          <span className="absolute top-0 bottom-0 left-0 w-0.5 rounded-full bg-white/10" />
          <span
            data-story-progress
            className="absolute top-0 bottom-0 left-0 w-0.5 origin-top rounded-full bg-plum-300"
          />
          {panels.map((panel, index) => (
            <li
              key={panel.id}
              data-story-marker
              className="flex items-baseline gap-4 py-3 text-2xl font-semibold tracking-tight"
            >
              <span className="text-xs text-plum-400 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              {panel.label}
            </li>
          ))}
        </ol>

        <div data-story-stack className="flex flex-col gap-20 lg:col-span-8">
          {panels.map((panel) => (
            <article
              key={panel.id}
              data-story-panel
              aria-labelledby={`story-${panel.id}`}
              className="will-change-transform"
            >
              <h3 id={`story-${panel.id}`} className="eyebrow mb-6 text-plum-300">
                {panel.label}
              </h3>
              {panel.content}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
