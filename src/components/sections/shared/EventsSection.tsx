import { Stagger } from "@/components/animations/Stagger";
import { Container, Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/States";
import type { ChurchEvent } from "@/types/content";
import { EventCard } from "../events/EventCard";

type EventsSectionProps = {
  events: ChurchEvent[];
  sheet?: boolean;
};

/** Upcoming-events preview (home page). Events come pre-sorted from content.ts. */
export function EventsSection({ events, sheet }: EventsSectionProps) {
  return (
    <Section tone="canvas" sheet={sheet}>
      <Container>
        <SectionHeading
          eyebrow="What’s coming up"
          title="Upcoming events"
          action={
            <Button href="/events" variant="tinted" icon="arrowRight">
              All events
            </Button>
          }
        />
        {events.length ? (
          <Stagger as="ul" variant="tilt" className="mt-14 grid gap-4 md:mt-20 md:grid-cols-2">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard event={event} showImage={false} />
              </li>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            className="mt-14"
            title="No upcoming events right now"
            description="New events are announced here and on our YouTube channel — check back soon."
          />
        )}
      </Container>
    </Section>
  );
}
