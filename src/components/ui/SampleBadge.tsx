import { cn } from "@/lib/utils/cn";

/**
 * Marks placeholder content so it is never mistaken for confirmed church
 * information. Disappears automatically once real content is added in Sanity.
 */
export function SampleBadge({ show, className }: { show?: boolean; className?: string }) {
  if (!show) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-current/[0.08] px-2.5 py-1 text-[0.6875rem] font-semibold whitespace-nowrap",
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      Sample content
    </span>
  );
}
