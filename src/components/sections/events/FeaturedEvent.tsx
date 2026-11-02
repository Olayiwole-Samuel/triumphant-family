import Link from "next/link";
import { ImageReveal } from "@/components/animations/ImageReveal";
import { Reveal } from "@/components/animations/Reveal";
import { MediaImage } from "@/components/media/MediaImage";
import { Gleam } from "@/components/ui/Gleam";
import { Icon } from "@/components/ui/Icon";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { FORMAT_LABELS } from "@/lib/events/archive";
import { formatEventDates, formatEventTimes } from "@/lib/events/time";
import type { ChurchEvent } from "@/types/content";
import { EventDateTile } from "./EventDateTile";

/** A real, published, featured upcoming event — shown in the Events hero. */
export function FeaturedEvent({ event }: { event: ChurchEvent }) {
  const where = event.format === "online" ? "Online" : [event.location, event.format === "hybrid" ? "& online" : null].filter(Boolean).join(" ");
  return (
    <article className="group relative grid gap-6 md:grid-cols-12 md:items-center md:gap-10">
      <div className="md:col-span-7">
        {event.flyer ? (
          <ImageReveal trigger="load" delay={0.5} className="relative aspect-[16/10] shadow-float">
            <MediaImage image={event.flyer} sizes="(min-width: 768px) 55vw, 100vw" priority />
          </ImageReveal>
        ) : (
          <Reveal trigger="load" delay={0.5} className="material-dark squircle grid aspect-[16/10] place-items-center rounded-media">
            <Gleam className="size-20 text-plum-200" />
          </Reveal>
        )}
      </div>
      <Reveal trigger="load" delay={0.7} y={20} className="md:col-span-5">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-plum-100">Featured event</span>
          <SampleBadge show={event.isSample} className="text-plum-200" />
        </div>
        <div className="mt-5 flex items-start gap-4">
          <EventDateTile event={event} size="lg" />
          <h2 className="text-display-sm font-bold">
            <Link href={event.href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {event.title}
            </Link>
          </h2>
        </div>
        <ul className="mt-5 space-y-1.5 text-sm text-plum-200">
          <li>{formatEventDates(event)}</li>
          {formatEventTimes(event) && <li>{formatEventTimes(event)}</li>}
          {where && <li>{where || FORMAT_LABELS[event.format]}</li>}
        </ul>
        {event.summary && <p className="mt-4 text-white/80">{event.summary}</p>}
        <span className="mt-6 inline-flex items-center gap-2 font-semibold group-hover:underline">
          Event details <Icon name="arrowRight" size={18} />
        </span>
      </Reveal>
    </article>
  );
}
