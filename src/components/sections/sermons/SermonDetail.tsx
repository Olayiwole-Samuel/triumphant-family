import Link from "next/link";
import { Aurora } from "@/components/animations/Aurora";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { Stagger } from "@/components/animations/Stagger";
import { Container, Section } from "@/components/layout/Section";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { YouTubePlayer } from "@/components/media/YouTubePlayer";
import { Icon } from "@/components/ui/Icon";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { archiveHref, parseArchiveQuery } from "@/lib/sermons/archive";
import { formatDate } from "@/lib/utils/format";
import { formatDuration } from "@/lib/youtube/parse";
import type { Sermon } from "@/types/content";
import { VideoCard } from "../shared/VideoCard";

type RelatedEntry = { sermon: Sermon; reason: string };

/** JSON-LD for search engines — only when the real data needed for it exists. */
function sermonStructuredData(sermon: Sermon) {
  if (!sermon.youtubeVideoId || !sermon.date || !sermon.thumbnail?.url) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: sermon.title,
    description: sermon.description?.slice(0, 500) || sermon.title,
    thumbnailUrl: [sermon.thumbnail.url],
    uploadDate: sermon.date,
    embedUrl: `https://www.youtube-nocookie.com/embed/${sermon.youtubeVideoId}`,
    ...(sermon.durationSeconds ? { duration: `PT${sermon.durationSeconds}S` } : {}),
  };
}

const topicHref = (topic: string) => archiveHref({ ...parseArchiveQuery({}), topic });

/**
 * A sermon page. Motion is limited to the title; the player and audio
 * controls stay still and easy to use. Missing optional fields simply
 * don't render — no empty labels.
 */
export function SermonDetail({
  sermon,
  related,
  recent,
}: {
  sermon: Sermon;
  related: RelatedEntry[];
  recent: Sermon[];
}) {
  const hasVideo = Boolean(sermon.youtubeVideoId);
  const hasAudio = Boolean(sermon.audioUrl);
  const meta = [
    sermon.speaker,
    sermon.date ? formatDate(sermon.date) : null,
    sermon.durationSeconds ? formatDuration(sermon.durationSeconds) : null,
  ].filter(Boolean);
  const scriptures = [sermon.scripture, ...sermon.otherScriptures].filter(Boolean) as string[];
  const structuredData = sermonStructuredData(sermon);

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          // JSON.stringify output with "<" escaped is safe inside a script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      )}

      <header className="surface-dark relative isolate overflow-hidden bg-plum-950 pt-32 pb-[calc(3rem+var(--radius-sheet))] md:pt-40">
        <Aurora className="opacity-70" />
        <div className="container-site">
          <Link
            href="/sermons"
            className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-semibold text-plum-300 hover:text-white"
          >
            <Icon name="chevronLeft" size={16} /> All sermons
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {sermon.series && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-plum-200">
                {sermon.series}
              </span>
            )}
            {sermon.source === "youtube" && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-plum-200">
                From our YouTube channel
              </span>
            )}
            <SampleBadge show={sermon.isSample} className="text-plum-200" />
          </div>
          <SplitText as="h1" trigger="load" className="mt-5 max-w-4xl text-display-md font-bold">
            {sermon.title}
          </SplitText>
          {meta.length > 0 && <p className="mt-5 text-plum-200">{meta.join("  ·  ")}</p>}
          {sermon.scripture && <p className="scripture mt-2 text-2xl text-plum-100">{sermon.scripture}</p>}
        </div>
      </header>

      <Section tone="canvas" sheet className="pt-[calc(var(--radius-sheet)+2rem)]!">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {hasVideo && (
              <YouTubePlayer
                videoId={sermon.youtubeVideoId}
                title={sermon.title}
                thumbnailUrl={sermon.thumbnail?.url}
                embeddable={sermon.embeddable}
                priority
              />
            )}
            {hasAudio && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-plum-950/60">
                  {hasVideo ? "Prefer to listen?" : "Listen to this message"}
                </h2>
                <AudioPlayer src={sermon.audioUrl!} mimeType={sermon.audioMimeType} title={sermon.title} />
              </div>
            )}
            {!hasVideo && !hasAudio && (
              <EmptyState
                icon="play"
                title="This recording isn’t available yet"
                description="The video or audio for this message hasn’t been added. Please check back soon."
              />
            )}
          </div>

          <aside className="space-y-8 lg:col-span-4">
            {sermon.description && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-plum-950/60">About this message</h2>
                <p className="leading-relaxed whitespace-pre-line text-plum-950/80">{sermon.description}</p>
              </div>
            )}
            {scriptures.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-plum-950/60">Scripture</h2>
                <ul className="space-y-1">
                  {scriptures.map((reference) => (
                    <li key={reference} className="scripture text-2xl text-plum-800">
                      {reference}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sermon.topics.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-plum-950/60">Topics</h2>
                <ul className="flex flex-wrap gap-2">
                  {sermon.topics.map((topic) => (
                    <li key={topic}>
                      <Link
                        href={topicHref(topic)}
                        className="inline-flex h-9 items-center rounded-full bg-plum-100 px-4 text-sm font-semibold text-plum-700 hover:bg-plum-200"
                      >
                        {topic}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </Container>
      </Section>

      {(related.length > 0 || recent.length > 0) && (
        <Section tone="white">
          <Container>
            <Reveal as="h2" y={12} className="text-display-sm font-bold">
              {related.length > 0 ? "Related messages" : "More recent messages"}
            </Reveal>
            <Stagger as="ul" className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {(related.length > 0 ? related : recent.map((sermon) => ({ sermon, reason: "" }))).map(
                ({ sermon: item, reason }) => (
                  <li key={item.id}>
                    {reason && <p className="mb-3 text-xs font-semibold text-plum-600">{reason}</p>}
                    <VideoCard sermon={item} tone="light" />
                  </li>
                ),
              )}
            </Stagger>
          </Container>
        </Section>
      )}
    </>
  );
}

export function SermonDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading sermon">
      <div className="bg-plum-950 pt-40 pb-24 text-white">
        <div className="container-site">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-8 h-14 w-3/4 max-w-3xl" />
          <Skeleton className="mt-5 h-4 w-60" />
        </div>
      </div>
      <div className="container-site py-16 text-plum-950">
        <Skeleton className="aspect-video w-full max-w-4xl rounded-card" />
      </div>
    </div>
  );
}
