import { Gleam } from "@/components/ui/Gleam";
import { cn } from "@/lib/utils/cn";

type MediaPlaceholderProps = {
  /** Short caption, e.g. "Church photography". Read by screen readers. */
  label?: string;
  tone?: "deep" | "plum" | "soft";
  className?: string;
};

/**
 * Shown wherever a photo has not been uploaded yet: a soft tonal glow (like an
 * iOS wallpaper) with the gleam mark — intentional, never "broken".
 * All tones are variations of the logo purple, so nothing clashes.
 */
const TONES = {
  deep: {
    base: "bg-plum-900",
    glow: "bg-[radial-gradient(60%_60%_at_30%_25%,var(--color-plum-600),transparent_70%),radial-gradient(50%_50%_at_80%_80%,var(--color-plum-700),transparent_70%)]",
    mark: "text-plum-300/70",
  },
  plum: {
    base: "bg-plum-700",
    glow: "bg-[radial-gradient(60%_60%_at_70%_20%,var(--color-plum-400),transparent_70%),radial-gradient(60%_60%_at_20%_90%,var(--color-plum-900),transparent_70%)]",
    mark: "text-plum-100/70",
  },
  soft: {
    base: "bg-plum-100",
    glow: "bg-[radial-gradient(60%_60%_at_25%_20%,var(--color-white),transparent_70%),radial-gradient(60%_60%_at_80%_85%,var(--color-plum-300),transparent_70%)]",
    mark: "text-plum-600/50",
  },
} as const;

export function MediaPlaceholder({ label, tone = "deep", className }: MediaPlaceholderProps) {
  const style = TONES[tone];
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative isolate h-full w-full overflow-hidden", style.base, className)}
    >
      <div className={cn("absolute inset-0", style.glow)} />
      <Gleam className={cn("absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-1/2", style.mark)} />
      {label && (
        <span
          className={cn(
            "absolute bottom-4 left-4 text-xs font-medium",
            tone === "soft" ? "text-plum-700" : "text-white/70",
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
