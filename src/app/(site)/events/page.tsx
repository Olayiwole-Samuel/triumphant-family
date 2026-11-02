import { Suspense } from "react";
import { Aurora } from "@/components/animations/Aurora";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { Container, Section } from "@/components/layout/Section";
import { EventsArchive, EventsArchiveSkeleton } from "@/components/sections/events/EventsArchive";
import { FeaturedEvent } from "@/components/sections/events/FeaturedEvent";
import { getEventsPage, getEventsSnapshot } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Events",
  description:
    "Services, conferences and gatherings at The Triumphant Family — find upcoming events, add them to your calendar, and browse past events.",
  path: "/events",
});

/**
 * Events: editorial hero (+ featured upcoming event when one is published)
 * → archive with Upcoming/Past, search and filters (streams in; reads the URL).
 */
export default async function EventsPage(props: PageProps<"/events">) {
  const [page, events] = await Promise.all([getEventsPage(), getEventsSnapshot()]);
  // Only a real, published, featured event that hasn't finished.
  const featured = events
    .filter((event) => event.featured && event.status === "upcoming")
    .sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!))[0];

  return (
    <>
      <section className="surface-dark relative isolate overflow-hidden bg-plum-950 pt-32 pb-[calc(4rem+var(--radius-sheet))] md:pt-40">
        <Aurora />
        <div className="container-site">
          <Reveal as="p" trigger="load" y={12} className="eyebrow mb-4 text-plum-300">
            Events
          </Reveal>
          <SplitText as="h1" trigger="load" delay={0.1} className="text-display-lg max-w-5xl font-bold">
            {page.heading}
          </SplitText>
          <Reveal as="p" trigger="load" delay={0.4} y={16} className="mt-6 max-w-2xl text-lead text-plum-200">
            {page.intro ??
              "Services, conferences and gatherings for the whole family — in person and online. Find what’s coming up and save the date."}
          </Reveal>
          {featured && (
            <div className="mt-14 md:mt-20">
              <FeaturedEvent event={featured} />
            </div>
          )}
        </div>
      </section>

      <Section tone="canvas" sheet className="pt-[calc(var(--radius-sheet)+1.5rem)]!">
        <Container>
          <div id="events" className="scroll-mt-28">
            <Suspense fallback={<EventsArchiveSkeleton />}>
              <EventsArchive searchParams={props.searchParams} />
            </Suspense>
          </div>
        </Container>
      </Section>
    </>
  );
}
