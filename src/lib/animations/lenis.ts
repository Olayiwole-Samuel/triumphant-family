import type Lenis from "lenis";

/**
 * Access point for the single, global Lenis instance created by
 * <SmoothScroll /> (src/components/animations/SmoothScroll.tsx).
 *
 * Components never create their own Lenis — they call these helpers.
 */
let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Stops page scrolling (e.g. while the mobile menu is open) and resumes it. */
export function lockScroll(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  if (locked) instance?.stop();
  else instance?.start();
}

export function scrollToTarget(target: string | number | HTMLElement, offset = 0) {
  if (instance) {
    instance.scrollTo(target, { offset });
    return;
  }
  // Fallback when Lenis is not running.
  if (typeof target === "number") window.scrollTo({ top: target + offset });
  else {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    element?.scrollIntoView();
  }
}
