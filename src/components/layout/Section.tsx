import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Section surfaces — all tonal variations of the logo purple.
 * - canvas: very pale plum (the page background, like iOS grouped background)
 * - white:  pure white
 * - deep:   plum-900 (rich dark)
 * - night:  plum-950 (darkest — hero, footer)
 *
 * `sheet` makes a light section slide over the dark one above it with rounded
 * top corners, like an iOS sheet.
 */
const TONES = {
  canvas: "bg-plum-50 text-plum-950",
  white: "bg-white text-plum-950",
  deep: "surface-dark bg-plum-900",
  night: "surface-dark bg-plum-950",
} as const;

export type SectionTone = keyof typeof TONES;

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  tone?: SectionTone;
  /** Apply the standard vertical padding (default true). */
  spaced?: boolean;
  /** Rounded top that overlaps the previous section. */
  sheet?: boolean;
  children: ReactNode;
};

export function Section({
  tone = "canvas",
  spaced = true,
  sheet = false,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("relative", TONES[tone], spaced && "section-y", sheet && "sheet", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("container-site", className)}>{children}</div>;
}
