import type { SVGProps } from "react";

/**
 * The "gleam" — a soft four-point sparkle, the site's signature mark
 * (from "The Gleam of Salvation"). Draws in currentColor.
 */
export function Gleam(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <path
        fill="currentColor"
        d="M12 1.5c.55 5.1 2.6 8.3 10.5 10.5C14.6 14.2 12.55 17.4 12 22.5 11.45 17.4 9.4 14.2 1.5 12 9.4 9.8 11.45 6.6 12 1.5Z"
      />
    </svg>
  );
}

/**
 * App-icon style tile (rounded square, tonal plum gradient) holding the gleam.
 * Used as the placeholder logo until a real logo is uploaded in the Studio.
 */
export function GleamTile({ className = "size-10" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`squircle relative grid shrink-0 place-items-center overflow-hidden rounded-[28%] bg-linear-to-br from-plum-500 via-plum-600 to-plum-800 shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] ${className}`}
    >
      <Gleam className="size-[55%] text-white" />
    </span>
  );
}
