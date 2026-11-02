/**
 * The motion vocabulary for the whole site. Tune the feel of every animation
 * here instead of hard-coding values inside components.
 */

export const EASE = {
  /** Default for entrances — confident, settles softly. */
  out: "power3.out",
  /** Big cinematic moves (hero, image reveals). */
  expo: "expo.out",
  /** Symmetric moves (menus opening and closing). */
  inOut: "power3.inOut",
  /** Scroll-linked motion must be linear; scrub adds the smoothing. */
  none: "none",
} as const;

export const DURATION = {
  fast: 0.45,
  base: 0.9,
  slow: 1.3,
  cinematic: 1.8,
} as const;

export const STAGGER = {
  chars: 0.02,
  words: 0.05,
  lines: 0.1,
  items: 0.09,
} as const;

/**
 * Scrub = seconds the animation takes to "catch up" with the scrollbar.
 * Higher values feel heavier and more cinematic. Use deliberately — not
 * every scroll animation needs trailing motion.
 */
export const SCRUB = {
  /** Directly tied to scroll (parallax). */
  direct: true,
  /** Light trailing. */
  soft: 1,
  /** Sticky storytelling / pinned sections. */
  trailing: 2,
  /** Long, heavy moves (horizontal galleries). */
  cinematic: 2.5,
} as const;

/** Where on screen scroll-triggered reveals start. */
export const START = {
  reveal: "top 85%",
  section: "top 70%",
} as const;

/** Media queries used with gsap.matchMedia(). Keep in sync with Tailwind's `lg`. */
export const MEDIA = {
  isDesktop: "(min-width: 1024px)",
  isMobile: "(max-width: 1023.98px)",
  reduceMotion: "(prefers-reduced-motion: reduce)",
  finePointer: "(hover: hover) and (pointer: fine)",
} as const;

/** Hero entrance choreography (seconds after load). */
export const HERO_TIMING = {
  eyebrow: 0.15,
  title: 0.3,
  image: 0.45,
  subtitle: 0.9,
  actions: 1.05,
} as const;
