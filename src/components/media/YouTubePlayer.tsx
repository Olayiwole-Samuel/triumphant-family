"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/States";
import { cn } from "@/lib/utils/cn";
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl, getYouTubeWatchUrl } from "@/lib/youtube/utils";

type YouTubePlayerProps = {
  /** Must be a valid 11-character YouTube video ID — anything else renders a safe fallback. */
  videoId?: string;
  /** Accessible name for the player and iframe, e.g. the sermon title. */
  title: string;
  thumbnailUrl?: string;
  /** false when YouTube reports embedding is disabled (Data API). */
  embeddable?: boolean;
  /** Only for a player that is visible on first load. */
  priority?: boolean;
  /** Small label over the poster, e.g. "Live now". */
  badge?: ReactNode;
  className?: string;
};

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Lightweight YouTube player.
 *
 * Shows a poster with a play button and loads the (privacy-enhanced,
 * youtube-nocookie.com) iframe only when the visitor presses play — so pages
 * with several videos stay fast, and nothing ever plays by itself.
 * A direct "Watch on YouTube" link is always available, and is the only
 * option when the ID is invalid or embedding is disabled.
 */
export function YouTubePlayer({
  videoId,
  title,
  thumbnailUrl,
  embeddable,
  priority = false,
  badge,
  className,
}: YouTubePlayerProps) {
  const valid = Boolean(videoId && VIDEO_ID.test(videoId));
  const [state, setState] = useState<"poster" | "loading" | "ready">("poster");
  const [slow, setSlow] = useState(false);
  const [poster, setPoster] = useState<string | null>(
    valid ? (thumbnailUrl ?? getYouTubeThumbnailUrl(videoId!)) : null,
  );

  // If loading takes unusually long (blocked embeds, slow network), offer the YouTube link.
  useEffect(() => {
    if (state !== "loading") return;
    const timer = window.setTimeout(() => setSlow(true), 10_000);
    return () => window.clearTimeout(timer);
  }, [state]);

  const frame = cn(
    "squircle relative aspect-video w-full overflow-hidden rounded-card bg-plum-950",
    className,
  );

  if (!valid || embeddable === false) {
    return (
      <div className={cn(frame, "grid place-items-center p-6 text-center text-white")}>
        <div className="max-w-sm">
          <Icon name="play" size={28} className="mx-auto text-plum-300" />
          <p className="mt-3 font-semibold">
            {valid ? "This video can’t be played on our website" : "This video isn’t available"}
          </p>
          {valid && (
            <a
              href={getYouTubeWatchUrl(videoId!)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-plum-950"
            >
              Watch on YouTube <Icon name="arrowUpRight" size={16} />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  const id = videoId!;

  return (
    <div>
      <div className={frame}>
        {state === "poster" ? (
          <button
            type="button"
            onClick={() => setState("loading")}
            className="group absolute inset-0 block h-full w-full cursor-pointer"
          >
            <span className="sr-only">Play video: {title}</span>
            {poster && (
              <Image
                src={poster}
                alt=""
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                preload={priority}
                className="object-cover transition-transform duration-1000 ease-out-expo group-hover:scale-[1.03]"
                onError={() =>
                  setPoster((currentPoster) =>
                    currentPoster === getYouTubeThumbnailUrl(id) ? null : getYouTubeThumbnailUrl(id),
                  )
                }
              />
            )}
            <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-plum-950/60 via-transparent to-transparent" />
            {badge && <span className="absolute top-4 left-4">{badge}</span>}
            <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
              <span className="material-light grid size-20 place-items-center rounded-full text-plum-950 transition-transform duration-500 ease-spring group-hover:scale-110 md:size-24">
                <Icon name="play" size={30} className="translate-x-0.5" />
              </span>
            </span>
          </button>
        ) : (
          <>
            <iframe
              src={`${getYouTubeEmbedUrl(id)}&autoplay=1&playsinline=1`}
              title={`YouTube video: ${title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              onLoad={() => setState("ready")}
              className="absolute inset-0 h-full w-full border-0"
            />
            {state === "loading" && (
              <div
                role="status"
                className="pointer-events-none absolute inset-0 grid place-items-center bg-plum-950/80 text-white"
              >
                <span className="flex flex-col items-center gap-3 text-sm">
                  <Spinner />
                  Loading video…
                </span>
              </div>
            )}
          </>
        )}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-75">
        <a
          href={getYouTubeWatchUrl(id)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
        >
          Watch on YouTube <Icon name="arrowUpRight" size={15} />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        {slow && state === "loading" && <span role="status">Taking a while? Try watching on YouTube.</span>}
      </p>
    </div>
  );
}
