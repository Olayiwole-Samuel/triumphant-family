/**
 * The ONLY place GSAP plugins are registered. Every animated component imports
 * gsap, ScrollTrigger, SplitText and useGSAP from here — never directly from
 * "gsap" — so plugins are registered exactly once.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DURATION, EASE } from "./constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
  gsap.defaults({ ease: EASE.out, duration: DURATION.base });
  // Avoid re-calculating every trigger when the mobile address bar shows/hides.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
