import Link from "next/link";
import { ImageReveal } from "@/components/animations/ImageReveal";
import { Reveal } from "@/components/animations/Reveal";
import { Stagger } from "@/components/animations/Stagger";
import { Container, Section } from "@/components/layout/Section";
import { MediaImage } from "@/components/media/MediaImage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/States";
import { formatDate } from "@/lib/utils/format";
import type { Sermon } from "@/types/content";

type SermonShowcaseProps = {
  /** From Sanity only (editor's pick → "featured" → newest). */
  featured?: Sermon;
  /** Other recent sermons from Sanity. */
  more: Sermon[];
  /** The church's latest real YouTube uploads — shown only when `more` is empty. */
  uploads: Sermon[];
  youtubeChannelUrl?: string;
  /** Hides the "All sermons" link when used on the sermons page itself. */
  standalone?: boolean;
};

function SermonMeta({ sermon }: { sermon: Sermon }) {
  const parts = [sermon.speaker, sermon.date ? formatDate(sermon.date) : null, sermon.scripture].filter(Boolean);
  if (!parts.length) return null;
  return <p className="text-sm text-plum-300">{parts.join("  ·  ")}</p>;
}

/** Thumbnail that opens the sermon's page on this site. */
function SermonThumb({ sermon, sizes, large }: { sermon: Sermon; sizes: string; large?: boolean }) {
  const thumb = (
    <>
      <MediaImage
        image={sermon.thumbnail}
        sizes={sizes}
        className="transition-transform duration-1000 ease-out-expo group-hover:scale-[1.04]"
        placeholderTone="deep"
      />
      {(sermon.youtubeVideoId || sermon.audioUrl) && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <span
            className={`material-light grid place-items-center rounded-full text-plum-950 transition-transform duration-500 ease-spring group-hover:scale-110 ${large ? "size-20 md:size-24" : "size-14"}`}
          >
            <Icon name="play" size={large ? 30 : 20} className="translate-x-0.5" />
          </span>
        </span>
      )}
    </>
  );

  const frame = "squircle group relative block aspect-video overflow-hidden rounded-card bg-plum-900";
  return (
    <Link href={sermon.href} className={frame}>
      {thumb}
      <span className="sr-only">Watch “{sermon.title}”</span>
    </Link>
  );
}

/** Featured sermon + a row of recent messages. Dark, cinematic, restrained motion. */
export function SermonShowcase({
  featured,
  more,
  uploads,
  youtubeChannelUrl,
  standalone = false,
}: SermonShowcaseProps) {
  const row = more.length ? more : uploads;
  const rowLabel = more.length ? "More messages" : "Latest on YouTube";

  return (
    <Section tone="night" className="overflow-hidden">
      <Container>
        <SectionHeading
          eyebrow="Featured message"
          title="Hear the Word"
          action={
            standalone ? undefined : (
              <Button href="/sermons" variant="glass" icon="arrowRight">
                All sermons
              </Button>
            )
          }
        />

        {featured ? (
          <div className="mt-14 grid gap-10 md:mt-20 lg:grid-cols-12 lg:items-center lg:gap-14">
            <ImageReveal className="shadow-float lg:col-span-7">
              <SermonThumb sermon={featured} sizes="(min-width: 1024px) 58vw, 100vw" large />
            </ImageReveal>
            <Reveal className="lg:col-span-5">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                {featured.series && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-plum-200">
                    {featured.series}
                  </span>
                )}
                <SampleBadge show={featured.isSample} className="text-plum-200" />
              </div>
              <h3 className="text-display-sm font-bold">{featured.title}</h3>
              <div className="mt-4">
                <SermonMeta sermon={featured} />
              </div>
              {featured.description && (
                <p className="mt-6 line-clamp-4 text-white/75">{featured.description}</p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={featured.href} variant="white" icon="play" iconFirst magnetic>
                  Watch the sermon
                </Button>
                <Button href="/watch" variant="glass">
                  Watch & Listen
                </Button>
              </div>
            </Reveal>
          </div>
        ) : (
          <EmptyState
            className="mt-14"
            icon="play"
            title="The featured message hasn’t been chosen yet"
            description="Once sermons are added in the Studio, the featured message will appear here."
            action={
              youtubeChannelUrl ? (
                <Button href={youtubeChannelUrl} variant="white" icon="arrowUpRight">
                  Visit our YouTube channel
                </Button>
              ) : undefined
            }
          />
        )}

        {row.length > 0 && (
          <div className="mt-20">
            <h3 className="mb-6 text-sm font-semibold text-plum-300">{rowLabel}</h3>
            <Stagger as="ul" variant="tilt" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {row.map((sermon) => (
                <li key={sermon.id}>
                  <SermonThumb
                    sermon={sermon}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  />
                  <p className="mt-5 text-lg leading-snug font-semibold tracking-tight">{sermon.title}</p>
                  <div className="mt-1.5">
                    <SermonMeta sermon={sermon} />
                  </div>
                </li>
              ))}
            </Stagger>
          </div>
        )}
      </Container>
    </Section>
  );
}
