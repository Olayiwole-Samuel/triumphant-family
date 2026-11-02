import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import { Stagger } from "@/components/animations/Stagger";
import { Container, Section } from "@/components/layout/Section";
import { YouTubePlayer } from "@/components/media/YouTubePlayer";
import { Icon } from "@/components/ui/Icon";
import { RichText } from "@/components/ui/RichText";
import { getYouTubeThumbnailUrl } from "@/lib/youtube/utils";
import type { ChurchEvent, EventMedia, EventVideoKind } from "@/types/content";
import { VideoCard } from "../shared/VideoCard";
import { EventPhotoGrid } from "./EventPhotoGrid";

const KIND_LABELS: Record<EventVideoKind, string> = {
  sermon: "Message",
  highlight: "Highlights",
  worship: "Worship",
  other: "Video",
};

export function hasRecap(event: ChurchEvent, media: EventMedia) {
  return Boolean(
    event.recapBody || event.recapVideos.length || event.testimonies.length || media.photos.length || media.sermons.length,
  );
}

/**
 * Looking back on an event: what happened, the messages and videos, photos
 * and testimonies — each a section reachable from the tab bar, so the page
 * stays a lasting record years later.
 */
export function EventRecap({ event, media, otherYears }: { event: ChurchEvent; media: EventMedia; otherYears: ChurchEvent[] }) {
  const videos = event.recapVideos;
  const written = event.testimonies.filter((testimony) => testimony.kind === "written");
  const videoTestimonies = event.testimonies.filter((testimony) => testimony.kind === "video");
  const tabs = [
    event.recapBody && { id: "recap", label: "Recap" },
    (videos.length > 0 || media.sermons.length > 0) && { id: "messages", label: "Messages & videos" },
    media.photos.length > 0 && { id: "photos", label: `Photos (${media.photos.length})` },
    event.testimonies.length > 0 && { id: "testimonies", label: "Testimonies" },
    otherYears.length > 0 && { id: "other-years", label: "Other years" },
  ].filter((tab): tab is { id: string; label: string } => Boolean(tab));

  if (!tabs.length) return null;

  return (
    <div id="looking-back">
      {/* Tab bar: sticky, iOS segmented style; plain links so it works without JavaScript. */}
      <nav aria-label="Event recap" className="sticky top-16 z-30 border-b border-plum-950/5 bg-plum-50/85 backdrop-blur-xl md:top-20">
        <ul className="container-site flex gap-2 overflow-x-auto py-3">
          {tabs.map((tab) => (
            <li key={tab.id} className="shrink-0">
              <a
                href={`#${tab.id}`}
                className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-plum-800 shadow-card ring-1 ring-plum-950/5 transition-colors hover:bg-plum-100"
              >
                {tab.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {event.recapBody && (
        <Section tone="canvas" id="recap" className="scroll-mt-40">
          <Container className="max-w-4xl">
            <Reveal as="p" y={12} className="eyebrow text-plum-600">
              Looking back
            </Reveal>
            <h2 className="mt-3 text-display-sm font-bold">What God did</h2>
            <Reveal className="mt-8 text-lead text-plum-950/80">
              <RichText text={event.recapBody} />
            </Reveal>
          </Container>
        </Section>
      )}

      {(videos.length > 0 || media.sermons.length > 0) && (
        <Section tone="deep" id="messages" className="scroll-mt-40">
          <Container>
            <h2 className="text-display-sm font-bold">Messages & videos</h2>
            <p className="mt-3 max-w-2xl text-plum-200">Watch again — the messages, worship and highlights.</p>
            {videos.length > 0 && (
              <Stagger as="ul" className="mt-10 grid gap-8 md:grid-cols-2">
                {videos.map((video, index) => (
                  <li key={video.id} className={index === 0 && videos.length % 2 === 1 ? "md:col-span-2 lg:max-w-4xl" : undefined}>
                    <YouTubePlayer
                      videoId={video.videoId}
                      title={video.title}
                      thumbnailUrl={getYouTubeThumbnailUrl(video.videoId)}
                      badge={<span className="rounded-full bg-plum-950/70 px-3 py-1 text-xs font-semibold text-white">{KIND_LABELS[video.kind]}</span>}
                    />
                    <h3 className="mt-4 text-lg font-bold text-white">{video.title}</h3>
                    {(video.speaker || video.note) && (
                      <p className="mt-1 text-sm text-plum-200">{[video.speaker, video.note].filter(Boolean).join(" · ")}</p>
                    )}
                  </li>
                ))}
              </Stagger>
            )}
            {media.sermons.length > 0 && (
              <>
                <h3 className="mt-14 text-xl font-bold text-white">Sermons preached</h3>
                <Stagger as="ul" className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {media.sermons.map((sermon) => (
                    <li key={sermon.id}>
                      <VideoCard sermon={sermon} />
                    </li>
                  ))}
                </Stagger>
              </>
            )}
          </Container>
        </Section>
      )}

      {media.photos.length > 0 && (
        <Section tone="white" id="photos" className="scroll-mt-40">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-display-sm font-bold">Photos</h2>
              <Link href="/gallery" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-plum-600 hover:underline">
                Photo gallery <Icon name="arrowRight" size={15} />
              </Link>
            </div>
            <div className="mt-8">
              <EventPhotoGrid photos={media.photos} title={`Photos — ${event.title}`} />
            </div>
          </Container>
        </Section>
      )}

      {event.testimonies.length > 0 && (
        <Section tone="canvas" id="testimonies" className="scroll-mt-40">
          <Container>
            <h2 className="text-display-sm font-bold">Testimonies</h2>
            <p className="mt-3 max-w-2xl text-plum-950/65">What God did in people’s lives.</p>
            {videoTestimonies.length > 0 && (
              <ul className="mt-10 grid gap-8 md:grid-cols-2">
                {videoTestimonies.map((testimony) => (
                  <li key={testimony.id}>
                    <YouTubePlayer
                      videoId={testimony.videoId}
                      title={`Testimony — ${testimony.name}`}
                      thumbnailUrl={testimony.videoId ? getYouTubeThumbnailUrl(testimony.videoId) : undefined}
                    />
                    <p className="mt-3 font-semibold">{testimony.name}</p>
                    {(testimony.location || testimony.body) && (
                      <p className="mt-0.5 text-sm text-plum-950/60">{[testimony.location, testimony.body].filter(Boolean).join(" · ")}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {written.length > 0 && (
              <Stagger as="ul" className="mt-10 columns-1 gap-5 md:columns-2 lg:columns-3">
                {written.map((testimony) => (
                  <li key={testimony.id} className="mb-5 break-inside-avoid">
                    <figure className="squircle rounded-card bg-white p-6 shadow-card">
                      <Icon name="quote" size={22} className="text-plum-300" />
                      <blockquote className="mt-3 leading-relaxed whitespace-pre-line text-plum-950/85">
                        {testimony.body && testimony.body.length > 600 ? (
                          <details>
                            <summary className="cursor-pointer list-none">
                              {testimony.body.slice(0, 560).trimEnd()}…{" "}
                              <span className="font-semibold text-plum-600 underline underline-offset-4">Read more</span>
                            </summary>
                            <span className="mt-2 block">{testimony.body.slice(560)}</span>
                          </details>
                        ) : (
                          testimony.body
                        )}
                      </blockquote>
                      <figcaption className="mt-4 text-sm">
                        <span className="font-semibold">{testimony.name}</span>
                        {testimony.location && <span className="text-plum-950/55"> · {testimony.location}</span>}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </Stagger>
            )}
          </Container>
        </Section>
      )}

      {otherYears.length > 0 && (
        <Section tone="white" id="other-years" className="scroll-mt-40">
          <Container>
            <h2 className="text-display-sm font-bold">{event.series} through the years</h2>
            <ul className="mt-8 flex flex-wrap gap-3">
              {otherYears.map((other) => (
                <li key={other.id}>
                  <Link
                    href={other.href}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-plum-50 px-5 font-semibold text-plum-800 ring-1 ring-plum-950/5 hover:bg-plum-100"
                  >
                    {other.date ? other.date.slice(0, 4) : "Date to be announced"}
                    <span className="text-sm font-normal text-plum-950/55">{other.status === "upcoming" ? "Upcoming" : other.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </div>
  );
}
