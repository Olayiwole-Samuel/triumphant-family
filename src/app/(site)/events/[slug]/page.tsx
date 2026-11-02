import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventDetail, EventDetailSkeleton } from "@/components/sections/events/EventDetail";
import { filterEvents, parseEventQuery, relatedEvents } from "@/lib/events/archive";
import { formatEventDates } from "@/lib/events/time";
import { getEventBySlug, getEventMedia, getEventSeries, getEventSlugs, getEventsSnapshot, getSiteSettings } from "@/lib/content";
import { richTextToPlain } from "@/lib/utils/richtext";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

/**
 * Event detail: /events/<slug>. Published events are prerendered; others
 * render on first visit. Unknown, unpublished or hidden events → not found.
 */
export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  // Cache Components needs at least one entry; this one resolves to "not found".
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "no-events-yet" }];
}

export async function generateMetadata(props: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found", robots: { index: false } };
  const when = formatEventDates(event);
  const description =
    event.summary ??
    (event.description ? richTextToPlain(event.description).slice(0, 160) : undefined) ??
    [when, event.location].filter(Boolean).join(" · ");
  return pageMetadata({ title: event.title, description, path: event.href, image: event.flyer?.url });
}

async function EventContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, events, settings] = await Promise.all([getEventBySlug(slug), getEventsSnapshot(), getSiteSettings()]);
  if (!event) notFound();

  const [media, series] = await Promise.all([
    getEventMedia(event.id),
    event.series ? getEventSeries(event.series) : Promise.resolve([]),
  ]);
  const otherYears = series.filter((other) => other.id !== event.id);

  // Other years of a recurring event are listed separately, not as "related".
  const related = relatedEvents(event, events).filter((item) => !otherYears.some((other) => other.id === item.event.id));
  // Nothing in the same category → show other upcoming events, labelled as such.
  const more = related.length
    ? []
    : filterEvents(events, parseEventQuery({})).filter((other) => other.id !== event.id && other.status === "upcoming").slice(0, 3);

  return (
    <EventDetail
      event={event}
      related={related}
      more={more}
      siteUrl={SITE_URL}
      organizer={settings.churchName}
      media={media}
      otherYears={otherYears}
    />
  );
}

export default function EventPage(props: PageProps<"/events/[slug]">) {
  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventContent params={props.params} />
    </Suspense>
  );
}
