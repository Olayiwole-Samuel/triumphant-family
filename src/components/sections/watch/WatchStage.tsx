"use client";

import { YouTubePlayer } from "@/components/media/YouTubePlayer";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CHURCH_TIME_ZONE } from "@/lib/utils/format";
import { getYouTubeWatchUrl } from "@/lib/youtube/utils";
import type { LiveStatus } from "@/lib/youtube/parse";
import { useLiveStatus } from "@/lib/youtube/useLiveStatus";

export type StageVideo = {
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  embeddable?: boolean;
  /** Our page for this video (sermon detail), when there is one. */
  href?: string;
};

type WatchStageProps = {
  initialStatus: LiveStatus;
  /** What to show when nothing is live (editor's featured video → featured sermon → latest upload). */
  featured?: StageVideo;
  manual?: { videoId: string; url: string; note?: string };
  youtubeChannelUrl?: string;
};

const lagos = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: CHURCH_TIME_ZONE,
  }).format(new Date(iso));

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-plum-950/80 px-3 py-1.5 text-xs font-bold tracking-wider text-white backdrop-blur">
      <span aria-hidden="true" className="relative flex size-2.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-gold opacity-70 motion-reduce:animate-none" />
        <span className="relative size-2.5 rounded-full bg-brand-gold" />
      </span>
      LIVE NOW
    </span>
  );
}

/**
 * The Watch page's main stage. "Live now" appears ONLY when YouTube has
 * confirmed a live broadcast; the status refreshes in the background (see
 * useLiveStatus). Every other state is labelled for what it is.
 */
export function WatchStage({ initialStatus, featured, manual, youtubeChannelUrl }: WatchStageProps) {
  const status = useLiveStatus(initialStatus);
  const isLive = status.state === "live";
  const showEnded = status.state === "ended";
  const showManual = Boolean(manual) && (status.state === "unavailable" || status.state === "not_configured");

  const primary: StageVideo | undefined = isLive
    ? status.video
    : showEnded
      ? status.video
      : showManual && manual
        ? { videoId: manual.videoId, title: manual.note || "Shared by the church team" }
        : featured;

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
      <div className="lg:col-span-8">
        {primary ? (
          <YouTubePlayer
            key={primary.videoId}
            videoId={primary.videoId}
            title={primary.title}
            thumbnailUrl={primary.thumbnailUrl}
            embeddable={primary.embeddable}
            badge={isLive ? <LiveBadge /> : undefined}
            priority
            className="shadow-float"
          />
        ) : (
          <div className="squircle grid aspect-video place-items-center rounded-card bg-plum-900 p-6 text-center">
            <div>
              <Icon name="play" size={28} className="mx-auto text-plum-300" />
              <p className="mt-3 font-semibold">Videos will appear here soon</p>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-4" aria-live="polite">
        {isLive ? (
          <div>
            <LiveBadge />
            <h2 className="mt-4 text-display-sm font-bold">{status.video.title}</h2>
            <p className="mt-3 text-plum-200">
              We’re live right now. Press play to join the service, or watch on YouTube to chat
              with the family.
            </p>
            <Button href={getYouTubeWatchUrl(status.video.videoId)} variant="white" icon="play" iconFirst className="mt-6" magnetic>
              Watch Live
            </Button>
          </div>
        ) : (
          <div>
            {status.state === "upcoming" && (
              <div className="material-dark squircle mb-6 rounded-card p-5">
                <p className="text-xs font-semibold tracking-wide text-plum-300 uppercase">Next live stream</p>
                <p className="mt-2 font-semibold">{status.video.title}</p>
                <p className="mt-1 text-sm text-plum-200">
                  <time dateTime={status.startsAt}>{lagos(status.startsAt)}</time> WAT
                </p>
                <a
                  href={getYouTubeWatchUrl(status.video.videoId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Set a reminder on YouTube <Icon name="arrowUpRight" size={14} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            )}

            {showManual && manual ? (
              <div className="material-dark squircle mb-6 rounded-card p-5">
                <p className="text-xs font-semibold tracking-wide text-plum-300 uppercase">
                  Shared by the church team
                </p>
                <p className="mt-2 text-sm text-plum-100">
                  {manual.note ?? "The church has shared this stream link."} We can’t automatically
                  confirm whether it’s live right now.
                </p>
              </div>
            ) : status.state === "unavailable" ? (
              <p className="mb-6 flex items-start gap-2 text-sm text-plum-200">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                We couldn’t check for a live service just now. Recent messages are below.
              </p>
            ) : null}

            {primary && (
              <>
                <p className="text-sm font-semibold text-plum-300">
                  {showEnded ? "Streamed recently" : showManual ? "Stream link" : "Featured message"}
                </p>
                <h2 className="mt-2 text-display-sm font-bold">{primary.title}</h2>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {primary?.href && (
                <Button href={primary.href} variant="white" icon="arrowRight">
                  Sermon details
                </Button>
              )}
              <Button href="/sermons" variant="glass">
                All sermons
              </Button>
            </div>
            {youtubeChannelUrl && (
              <a
                href={youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-plum-200 underline-offset-4 hover:underline"
              >
                Subscribe on YouTube <Icon name="arrowUpRight" size={14} />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
