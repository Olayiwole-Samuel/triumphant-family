import type { ReactNode } from "react";
import Link from "next/link";
import { Aurora } from "@/components/animations/Aurora";
import { ImageReveal } from "@/components/animations/ImageReveal";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { Stagger } from "@/components/animations/Stagger";
import { Container, Section } from "@/components/layout/Section";
import { MediaImage } from "@/components/media/MediaImage";
import { Icon } from "@/components/ui/Icon";
import { RichText } from "@/components/ui/RichText";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { Skeleton } from "@/components/ui/States";
import { FORMAT_LABELS } from "@/lib/events/archive";
import { directionsUrl, placeLine } from "@/lib/events/calendar";
import { eventInstants, formatEventDates, formatEventTimes, isoWithOffset } from "@/lib/events/time";
import { formatDate } from "@/lib/utils/format";
import type { ChurchEvent, EventMedia } from "@/types/content";
import { EventActions } from "./EventActions";
import { EventCard } from "./EventCard";
import { EventRecap, hasRecap } from "./EventRecap";

/** schema.org Event — only fields backed by real content; omitted when there's no date. */
function eventStructuredData(event: ChurchEvent, siteUrl: string, organizer: string) {
  const instants = eventInstants(event);
  if (!instants || !event.date) return null;
  const physical =
    event.format !== "online" && event.location
      ? { "@type": "Place", name: event.location, ...(event.address ? { address: placeLine({ address: event.address }) } : {}) }
      : null;
  const virtual = event.format !== "in-person" && event.onlineUrl ? { "@type": "VirtualLocation", url: event.onlineUrl } : null;
  const location = [physical, virtual].filter(Boolean);
  if (!location.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: instants.allDay ? event.date : isoWithOffset(instants.start, instants.timezone),
    ...(instants.allDay
      ? instants.multiDay
        ? { endDate: instants.lastDay }
        : {}
      : instants.end
        ? { endDate: isoWithOffset(instants.end, instants.timezone) }
        : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.format === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.format === "hybrid"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    location: location.length === 1 ? location[0] : location,
    ...(event.summary || event.description ? { description: (event.summary ?? event.description)!.slice(0, 500) } : {}),
    ...(event.flyer?.url ? { image: [event.flyer.url] } : {}),
    organizer: { "@type": "Organization", name: organizer, url: siteUrl },
    url: `${siteUrl}${event.href}`,
  };
}

type Related = { event: ChurchEvent; reason: string };

/**
 * An event page. Key facts and actions come first; motion is limited to the
 * title, image and a gentle entrance for the actions. Missing optional
 * fields simply don't render.
 */
export function EventDetail({
  event,
  related,
  more,
  siteUrl,
  organizer,
  media,
  otherYears,
}: {
  event: ChurchEvent;
  related: Related[];
  more: ChurchEvent[];
  siteUrl: string;
  organizer: string;
  media: EventMedia;
  /** Other years of the same recurring event (series). */
  otherYears: ChurchEvent[];
}) {
  const dates = formatEventDates(event);
  const times = formatEventTimes(event);
  const directions = directionsUrl(event);
  const past = event.status === "past";
  const recap = hasRecap(event, media) || otherYears.length > 0;
  const structuredData = eventStructuredData(event, siteUrl, organizer);
  const where =
    event.format === "online"
      ? "Online"
      : [event.location, event.format === "hybrid" ? "and online" : null].filter(Boolean).join(" ");

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      )}

      <header className="surface-dark relative isolate overflow-hidden bg-plum-950 pt-32 pb-[calc(3.5rem+var(--radius-sheet))] md:pt-40">
        <Aurora className="opacity-70" />
        <div className="container-site grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className={event.flyer ? "lg:col-span-7" : "lg:col-span-10"}>
            <Link href="/events" className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-semibold text-plum-300 hover:text-white">
              <Icon name="chevronLeft" size={16} /> All events
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
              {event.category && <span className="rounded-full bg-white/10 px-3 py-1 text-plum-100">{event.category}</span>}
              <span className="rounded-full bg-white/10 px-3 py-1 text-plum-100">{FORMAT_LABELS[event.format]}</span>
              {past && <span className="rounded-full bg-white/10 px-3 py-1 text-plum-100">This event has ended</span>}
              {event.status === "tba" && <span className="rounded-full bg-white/10 px-3 py-1 text-plum-100">Date to be announced</span>}
              <SampleBadge show={event.isSample} className="text-plum-200" />
            </div>
            <SplitText as="h1" trigger="load" className="mt-5 text-display-md font-bold">
              {event.title}
            </SplitText>

            {/* Key facts are never hidden behind animation. */}
            <dl className="mt-6 grid gap-x-8 gap-y-2 text-plum-100 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <dt className="sr-only">Date</dt>
                <Icon name="calendar" size={18} className="mt-0.5 shrink-0 text-plum-300" />
                <dd>{dates ?? "Date to be announced"}</dd>
              </div>
              {times && (
                <div className="flex items-start gap-2">
                  <dt className="sr-only">Time</dt>
                  <Icon name="clock" size={18} className="mt-0.5 shrink-0 text-plum-300" />
                  <dd>{times}</dd>
                </div>
              )}
              {where && (
                <div className="flex items-start gap-2">
                  <dt className="sr-only">Where</dt>
                  <Icon name={event.format === "online" ? "play" : "mapPin"} size={18} className="mt-0.5 shrink-0 text-plum-300" />
                  <dd>{where}</dd>
                </div>
              )}
            </dl>
            {event.summary && <p className="mt-6 max-w-2xl text-lead text-plum-200">{event.summary}</p>}
            {past && hasRecap(event, media) && (
              <a
                href="#looking-back"
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-plum-950 shadow-card transition-[background-color,scale] hover:bg-plum-100 active:scale-[0.97]"
              >
                <Icon name="play" size={16} /> Look back: recap, videos & photos
              </a>
            )}

            <Reveal trigger="load" delay={0.35} y={14} className="mt-8">
              <EventActions
                siteUrl={siteUrl}
                event={{
                  title: event.title,
                  slug: event.slug,
                  summary: event.summary,
                  description: event.description,
                  date: event.date,
                  endDate: event.endDate,
                  startTime: event.startTime,
                  endTime: event.endTime,
                  allDay: event.allDay,
                  timezone: event.timezone,
                  location: event.location,
                  address: event.address,
                  onlineUrl: event.onlineUrl,
                  mapUrl: event.mapUrl,
                  moreInfoUrl: event.moreInfoUrl,
                  registrationUrl: event.registrationClosed ? undefined : event.registrationUrl,
                  status: event.status,
                  format: event.format,
                  calendarReady: event.calendarReady,
                }}
              />
            </Reveal>
          </div>
          {event.flyer && (
            <div className="lg:col-span-5">
              <ImageReveal trigger="load" delay={0.2} className="relative aspect-[4/5] shadow-float sm:aspect-[16/10] lg:aspect-[4/5]">
                <MediaImage image={event.flyer} sizes="(min-width: 1024px) 38vw, 100vw" priority />
              </ImageReveal>
            </div>
          )}
        </div>
      </header>

      <Section tone="canvas" sheet className="pt-[calc(var(--radius-sheet)+2rem)]!">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            {event.description && (
              <section aria-labelledby="about-event">
                <h2 id="about-event" className="text-display-sm font-bold">About this event</h2>
                <RichText text={event.description} className="mt-4 leading-relaxed text-plum-950/80" />
              </section>
            )}
            {event.schedule.length > 0 && (
              <section aria-labelledby="programme">
                <h2 id="programme" className="text-display-sm font-bold">Programme</h2>
                <ol className="squircle mt-5 overflow-hidden rounded-card bg-white shadow-card">
                  {event.schedule.map((item, index) => (
                    <li key={`${item.title}-${index}`} className="flex gap-4 border-b border-plum-100 px-5 py-4 last:border-0 md:px-6">
                      {item.time && <span className="w-24 shrink-0 text-sm font-semibold text-plum-600">{item.time}</span>}
                      <span>
                        <span className="block font-semibold">{item.title}</span>
                        {item.note && <span className="mt-0.5 block text-sm text-plum-950/60">{item.note}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {!event.description && event.schedule.length === 0 && (
              <p className="text-plum-950/65">More details about this event will be shared soon.</p>
            )}
          </div>

          <aside className="space-y-4 lg:col-span-5" aria-label="Event information">
            <InfoBlock title="When">
              <p className="font-semibold">{dates ?? "Date to be announced"}</p>
              {times && <p className="mt-1 text-sm text-plum-950/70">{times}</p>}
            </InfoBlock>

            {event.format !== "online" && (event.location || event.address) && (
              <InfoBlock title="Where">
                {event.location && <p className="font-semibold">{event.location}</p>}
                {event.address && <address className="mt-1 text-sm whitespace-pre-line text-plum-950/70 not-italic">{event.address}</address>}
                {directions && (
                  <a
                    href={directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-plum-600 hover:underline"
                  >
                    <Icon name="mapPin" size={15} /> Get directions <span className="sr-only">(opens maps in a new tab)</span>
                  </a>
                )}
              </InfoBlock>
            )}

            {event.format !== "in-person" && event.onlineUrl && !past && (
              <InfoBlock title="Online">
                <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-plum-600 hover:underline">
                  Join or watch online <Icon name="arrowUpRight" size={15} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </InfoBlock>
            )}

            {(event.registrationRequired || event.registrationUrl || event.registrationNote) && !past && (
              <InfoBlock title="Registration">
                {event.registrationRequired && <p className="font-semibold">Registration is required.</p>}
                {event.registrationDeadline && (
                  <p className="mt-1 text-sm text-plum-950/70">
                    {event.registrationClosed ? "Registration closed on " : "Register by "}
                    {formatDate(event.registrationDeadline)}.
                  </p>
                )}
                {event.registrationNote && <p className="mt-2 text-sm whitespace-pre-line text-plum-950/70">{event.registrationNote}</p>}
                {event.registrationUrl && !event.registrationClosed && (
                  <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-plum-600 hover:underline">
                    Open the registration form <Icon name="arrowUpRight" size={15} />
                    <span className="sr-only">(external site, opens in a new tab)</span>
                  </a>
                )}
              </InfoBlock>
            )}

            {(event.contactName || event.contactEmail || event.contactPhone) && (
              <InfoBlock title="Questions?">
                {event.contactName && <p className="font-semibold">{event.contactName}</p>}
                {event.contactEmail && (
                  <a href={`mailto:${event.contactEmail}`} className="mt-1 flex min-h-11 items-center gap-2 text-sm font-semibold text-plum-600 hover:underline">
                    <Icon name="mail" size={15} /> {event.contactEmail}
                  </a>
                )}
                {event.contactPhone && (
                  <a href={`tel:${event.contactPhone.replace(/[^\d+]/g, "")}`} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-plum-600 hover:underline">
                    <Icon name="phone" size={15} /> {event.contactPhone}
                  </a>
                )}
              </InfoBlock>
            )}
          </aside>
        </Container>
      </Section>

      {recap && <EventRecap event={event} media={media} otherYears={otherYears} />}

      {(related.length > 0 || more.length > 0) && (
        <Section tone="white">
          <Container>
            <h2 className="text-display-sm font-bold">{related.length ? "Related events" : "More upcoming events"}</h2>
            <Stagger as="ul" className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(related.length ? related : more.map((item) => ({ event: item, reason: "" }))).map(({ event: item, reason }) => (
                <li key={item.id}>
                  <EventCard event={item} reason={reason || undefined} showImage={false} />
                </li>
              ))}
            </Stagger>
          </Container>
        </Section>
      )}
    </>
  );
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="squircle rounded-card bg-white p-5 shadow-card md:p-6">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-plum-950/55 uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function EventDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading event">
      <div className="bg-plum-950 pt-40 pb-24 text-white">
        <div className="container-site">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-8 h-14 w-3/4 max-w-3xl" />
          <Skeleton className="mt-5 h-4 w-72" />
          <Skeleton className="mt-8 h-12 w-64 rounded-full" />
        </div>
      </div>
    </div>
  );
}
