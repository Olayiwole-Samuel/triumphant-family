import Link from "next/link";
import { Stagger } from "@/components/animations/Stagger";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { buildEventFacets, eventsHref, filterEvents, isEventFiltered, parseEventQuery } from "@/lib/events/archive";
import { paginate } from "@/lib/sermons/archive";
import { getEventsSnapshot } from "@/lib/content";
import { Pagination } from "../shared/Pagination";
import { EventCard } from "./EventCard";
import { EventFilters } from "./EventFilters";

/** The events archive. Reads the URL (tab/search/filters), so it streams inside <Suspense>. */
export async function EventsArchive({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseEventQuery(await searchParams);
  const all = await getEventsSnapshot();

  const counts = {
    upcoming: all.filter((e) => e.status === "upcoming" || e.status === "tba").length,
    past: all.filter((e) => e.status === "past").length,
  };
  const facets = buildEventFacets(all);
  const results = filterEvents(all, query);
  const page = paginate(results, query.page);
  const viewingUpcoming = query.when === "upcoming";

  return (
    <>
      <EventFilters facets={facets} query={query} counts={counts} />

      <div className="pt-10">
        <h2 className="sr-only">{viewingUpcoming ? "Upcoming events" : "Past events"}</h2>
        {page.total > 0 && (
          <p className="mb-8 text-sm text-plum-950/60" role="status" aria-live="polite">
            Showing {page.start}–{page.end} of {page.total} {viewingUpcoming ? "upcoming" : "past"}{" "}
            {page.total === 1 ? "event" : "events"}
            {query.q ? ` for “${query.q}”` : ""}
          </p>
        )}

        {page.items.length ? (
          <Stagger
            as="ul"
            key={eventsHref(query)}
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {page.items.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </Stagger>
        ) : isEventFiltered(query) ? (
          <EmptyState
            icon="search"
            title="No events match your search"
            description="Try a different word, or clear the filters."
            action={
              <Button href={`${eventsHref({ ...query, q: "", category: undefined, format: undefined, page: 1 })}#events`} variant="tinted">
                Clear filters
              </Button>
            }
          />
        ) : viewingUpcoming ? (
          <EmptyState
            title="No upcoming events have been published yet"
            description={
              counts.past > 0 ? (
                <>
                  New events will appear here.{" "}
                  <Link href="/events?when=past#events" scroll={false} className="font-semibold text-plum-600 underline-offset-4 hover:underline">
                    Browse past events
                  </Link>
                </>
              ) : (
                "New events will appear here — check back soon."
              )
            }
          />
        ) : (
          <EmptyState title="No past events yet" description="Events will be listed here after they take place." />
        )}

        <Pagination
          label="Event pages"
          anchor="events"
          page={page.page}
          hrefs={Array.from({ length: page.pageCount }, (_, i) => `${eventsHref(query, { page: i + 1 })}`)}
        />
      </div>
    </>
  );
}

export function EventsArchiveSkeleton() {
  return (
    <div role="status" aria-label="Loading events" className="text-plum-950">
      <Skeleton className="h-12 w-60 rounded-full" />
      <Skeleton className="mt-4 h-28 w-full rounded-card" />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-56 rounded-card" />
        ))}
      </div>
    </div>
  );
}
