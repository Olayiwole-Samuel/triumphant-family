import { gsap } from "./gsap";

/**
 * Elements marked for entrance animation start at opacity 0 (see the
 * "Motion gating" block in globals.css) — but only when motion is allowed and
 * JavaScript is running. These selectors must match that CSS.
 */
export const HIDDEN_UNTIL_ANIMATED = "[data-animate], [data-stagger] > *";

/** Makes every hidden-until-animated element inside `root` visible at once. */
export function revealImmediately(root: HTMLElement) {
  const targets: Element[] = Array.from(root.querySelectorAll(HIDDEN_UNTIL_ANIMATED));
  if (root.matches(HIDDEN_UNTIL_ANIMATED)) targets.push(root);
  if (targets.length) gsap.set(targets, { opacity: 1 });
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
