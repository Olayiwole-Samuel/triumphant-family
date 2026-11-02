import Link from "next/link";
import { MediaImage } from "@/components/media/MediaImage";
import { Icon } from "@/components/ui/Icon";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { FORMAT_LABELS } from "@/lib/events/archive";
import { formatEventDates, formatEventTimes } from "@/lib/events/time";
import { cn } from "@/lib/utils/cn";
import type { ChurchEvent } from "@/types/content";
import { EventDateTile } from "./EventDateTile";

/**
 * An event card. The title link stretches over the whole card (one link, no
 * nested links); a "Register" link — only when registration is required and
 * a sign-up link exists — sits above it as a separate, valid control.
 */
export function EventCard({ event, reason, showImage = true }: { event: ChurchEvent; reason?: string; showImage?: boolean }) {
  const dates = formatEventDates(event);
  const times = formatEventTimes(event);
  const past = event.status === "past";
  const registrationOpen = event.registrationRequired && event.registrationUrl && !past;

  return (
    <article className="squircle group relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card transition-[translate,box-shadow] duration-500 ease-spring hover:-translate-y-1 hover:shadow-float has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-plum-600">
      {showImage && event.flyer && (
        <div className="relative aspect-[16/9] overflow-hidden bg-plum-100">
          <MediaImage
            image={event.flyer}
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
            className={cn("transition-transform duration-1000 ease-out-expo group-hover:scale-[1.04]", past && "grayscale-[35%]")}
          />
        </div>
      )}
      <div className="flex flex-1 items-start gap-4 p-5 md:gap-5 md:p-6">
        <EventDateTile event={event} />
        <div className="flex min-w-0 flex-1 flex-col self-stretch">
          {reason && <p className="mb-1 text-xs font-semibold text-plum-600">{reason}</p>}
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {event.category && <span className="rounded-full bg-plum-50 px-2.5 py-1 text-plum-700">{event.category}</span>}
            {event.format !== "in-person" && (
              <span className="rounded-full bg-plum-50 px-2.5 py-1 text-plum-700">{FORMAT_LABELS[event.format]}</span>
            )}
            {past && <span className="rounded-full bg-plum-950/5 px-2.5 py-1 text-plum-950/60">Past event</span>}
          </div>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">
            <Link href={event.href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {event.title}
            </Link>
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-plum-950/70">
            <li className="flex items-start gap-2">
              <Icon name="calendar" size={15} className="mt-0.5 shrink-0 text-plum-400" />
              <span>
                <span className="sr-only">Date: </span>
                {dates ?? "Date to be announced"}
              </span>
            </li>
            {times && (
              <li className="flex items-start gap-2">
                <Icon name="clock" size={15} className="mt-0.5 shrink-0 text-plum-400" />
                <span>
                  <span className="sr-only">Time: </span>
                  {times}
                </span>
              </li>
            )}
            {(event.location || event.format === "online") && (
              <li className="flex items-start gap-2">
                <Icon name={event.format === "online" ? "play" : "mapPin"} size={15} className="mt-0.5 shrink-0 text-plum-400" />
                <span>
                  <span className="sr-only">Where: </span>
                  {event.format === "online" ? "Online" : event.location}
                </span>
              </li>
            )}
          </ul>
          {(event.summary || event.description) && (
            <p className="mt-3 line-clamp-2 text-sm text-plum-950/65">{event.summary ?? event.description}</p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
            {registrationOpen && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-plum-600 px-4 text-sm font-semibold text-white hover:bg-plum-700"
              >
                Register <Icon name="arrowUpRight" size={14} />
                <span className="sr-only">for {event.title} (external site, opens in a new tab)</span>
              </a>
            )}
            {event.registrationRequired && !past && (
              <span className="text-xs font-semibold text-plum-600">Registration required</span>
            )}
            <SampleBadge show={event.isSample} className="text-plum-600" />
          </div>
        </div>
      </div>
    </article>
  );
}
