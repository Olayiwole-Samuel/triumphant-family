"use client";

import type { RefObject } from "react";
import { MEDIA } from "./constants";
import { gsap, useGSAP } from "./gsap";
import { revealImmediately } from "./utils";

export type MotionConditions = {
  [K in keyof typeof MEDIA]: boolean;
};

type MotionSetup = (
  conditions: MotionConditions,
  root: HTMLElement,
) => void | (() => void);

type MotionOptions = {
  /** The component's root element. Selector strings are scoped to it. */
  scope: RefObject<HTMLElement | null>;
  /** Re-run (and cleanly revert) the animation when these change. */
  dependencies?: unknown[];
};

/**
 * The standard way to animate a component.
 *
 * Wraps useGSAP() + gsap.matchMedia() so that every animation:
 * - is scoped to the component and fully reverted on unmount
 * - receives breakpoint/pointer conditions to adapt desktop vs mobile
 * - is skipped entirely when the visitor prefers reduced motion (content is
 *   simply shown), and adapts live if that preference changes
 *
 * @example
 * useMotion((media, root) => {
 *   gsap.from(".card", { y: media.isDesktop ? 80 : 30 });
 * }, { scope: ref });
 */
export function useMotion(setup: MotionSetup, { scope, dependencies = [] }: MotionOptions) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add(
        MEDIA,
        (context) => {
          const conditions = context.conditions as MotionConditions;
          if (conditions.reduceMotion) {
            revealImmediately(root);
            return;
          }
          return setup(conditions, root);
        },
        root,
      );

      return () => mm.revert();
    },
    { scope, dependencies, revertOnUpdate: true },
  );
}
