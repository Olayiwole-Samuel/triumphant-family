import Link from "next/link";
import { Stagger } from "@/components/animations/Stagger";
import { MediaImage } from "@/components/media/MediaImage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { getFeaturedSermon, getSermonArchive, getSiteSettings } from "@/lib/content";
import {
  archiveHref,
  buildFacets,
  filterSermons,
  isFiltered,
  paginate,
  parseArchiveQuery,
} from "@/lib/sermons/archive";
import { formatDate } from "@/lib/utils/format";
import type { Sermon } from "@/types/content";
import { VideoCard } from "../shared/VideoCard";
import { Pagination } from "../shared/Pagination";
import { SermonFilters } from "./SermonFilters";

function FeaturedSermonCard({ sermon }: { sermon: Sermon }) {
  return (
    <article className="squircle group relative mb-12 grid overflow-hidden rounded-card bg-plum-950 text-white shadow-float md:grid-cols-2">
      <div className="relative aspect-video md:aspect-auto md:min-h-72">
        <MediaImage
          image={sermon.thumbnail}
          sizes="(min-width: 768px) 45vw, 100vw"
          className="transition-transform duration-1000 ease-out-expo group-hover:scale-[1.03]"
          placeholderTone="deep"
        />
      </div>
      <div className="flex flex-col justify-center p-7 md:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-plum-300">Featured message</span>
          <SampleBadge show={sermon.isSample} className="text-plum-200" />
        </div>
        <h2 className="mt-3 text-display-sm font-bold">
          <Link href={sermon.href} className="after:absolute after:inset-0">
            {sermon.title}
          </Link>
        </h2>
        <p className="mt-3 text-sm text-plum-200">
          {[sermon.speaker, sermon.date ? formatDate(sermon.date) : null].filter(Boolean).join("  ·  ")}
        </p>
        {sermon.description && <p className="mt-4 line-clamp-3 text-white/75">{sermon.description}</p>}
        <span className="mt-6 inline-flex items-center gap-2 font-semibold">
          Watch & listen <Icon name="arrowRight" size={18} />
        </span>
      </div>
    </article>
  );
}

/** The archive body. Reads the URL (search params), so it streams inside <Suspense>. */
export async function SermonArchive({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseArchiveQuery(await searchParams);
  const [all, featured, settings] = await Promise.all([getSermonArchive(), getFeaturedSermon(), getSiteSettings()]);

  if (all.length === 0) {
    return (
      <EmptyState
        icon="play"
        title="No sermons have been published yet"
        description="Messages will appear here once they are added. In the meantime, every service is on our YouTube channel."
        action={
          settings.youtubeChannelUrl ? (
            <Button href={settings.youtubeChannelUrl} variant="primary" icon="arrowUpRight">
              Open YouTube
            </Button>
          ) : undefined
        }
      />
    );
  }

  const facets = buildFacets(all);
  const results = filterSermons(all, query);
  const page = paginate(results, query.page);
  const showFeatured = featured && !isFiltered(query) && page.page === 1;

  return (
    <>
      {showFeatured && <FeaturedSermonCard sermon={featured} />}
      <SermonFilters facets={facets} query={query} />

      <div id="results" className="scroll-mt-28 pt-10">
        <h2 className="sr-only">Results</h2>
        <p className="mb-8 text-sm text-plum-950/60" role="status" aria-live="polite">
          {page.total === 0
            ? "No messages match your search."
            : `Showing ${page.start}–${page.end} of ${page.total} ${page.total === 1 ? "message" : "messages"}`}
          {query.q && page.total > 0 ? ` for “${query.q}”` : ""}
        </p>

        {page.items.length ? (
          <Stagger as="ul" className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" key={`${query.page}-${results.length}`}>
            {page.items.map((sermon) => (
              <li key={sermon.id}>
                <VideoCard sermon={sermon} tone="light" />
              </li>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            icon="search"
            title="Nothing found"
            description="Try a different word or spelling, or clear the filters to see every message."
            action={
              <Button href="/sermons#results" variant="tinted">
                Clear search
              </Button>
            }
          />
        )}

        <Pagination
          label="Sermon pages"
          page={page.page}
          hrefs={Array.from({ length: page.pageCount }, (_, i) => archiveHref(query, { page: i + 1 }))}
        />
      </div>
    </>
  );
}

export function SermonArchiveSkeleton() {
  return (
    <div role="status" aria-label="Loading sermons">
      <Skeleton className="h-40 w-full rounded-card text-plum-950" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-plum-950">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-video w-full rounded-card" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
