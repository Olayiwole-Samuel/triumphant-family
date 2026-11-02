import { dateTileParts } from "@/lib/events/time";
import { cn } from "@/lib/utils/cn";
import type { ChurchEvent } from "@/types/content";

/**
 * iOS Calendar-style tile from the event's own calendar date (no UTC
 * conversion, so no off-by-one days). Multi-day events show the range;
 * events without a date show "TBA".
 */
export function EventDateTile({ event, size = "md" }: { event: ChurchEvent; size?: "md" | "lg" }) {
  const parts = dateTileParts(event);
  const large = size === "lg";
  const sameMonth = parts?.end && parts.end.month === parts.month;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "squircle shrink-0 overflow-hidden rounded-2xl bg-white text-center shadow-card ring-1 ring-plum-100",
        parts?.end ? (large ? "min-w-28" : "min-w-20") : large ? "w-20" : "w-16",
      )}
    >
      <div className="bg-plum-600 px-2 py-1 text-[0.625rem] font-bold tracking-wider text-white uppercase">
        {!parts ? "Soon" : parts.end && !sameMonth ? `${parts.month} – ${parts.end.month}` : parts.month}
      </div>
      <div className={cn("px-2 leading-none font-bold tracking-tight text-plum-950", large ? "py-2 text-3xl" : "py-1.5 text-2xl")}>
        {!parts ? "TBA" : parts.end ? `${parts.day}–${parts.end.day}` : parts.day}
      </div>
      <div className="pb-1.5 text-[0.625rem] font-medium text-plum-950/55">
        {!parts ? "Date" : parts.end ? "Multi-day" : parts.weekday}
      </div>
    </div>
  );
}
