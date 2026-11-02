import Link from "next/link";
import { MediaImage } from "@/components/media/MediaImage";
import { Icon } from "@/components/ui/Icon";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { formatDate } from "@/lib/utils/format";
import { formatDuration } from "@/lib/youtube/parse";
import { cn } from "@/lib/utils/cn";
import type { Sermon } from "@/types/content";

/**
 * A sermon/video card linking to its detail page. Shows only the details
 * that actually exist (no placeholder labels for missing fields).
 */
export function VideoCard({ sermon, tone = "dark" }: { sermon: Sermon; tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  const meta = [sermon.speaker, sermon.date ? formatDate(sermon.date) : null].filter(Boolean);
  const hasVideo = Boolean(sermon.youtubeVideoId);
  const hasAudio = Boolean(sermon.audioUrl);

  return (
    <article className="group relative flex h-full flex-col">
      <div className="squircle relative aspect-video overflow-hidden rounded-card bg-plum-900">
        <MediaImage
          image={sermon.thumbnail}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="transition-transform duration-1000 ease-out-expo group-hover:scale-[1.04]"
          placeholderTone="deep"
        />
        {sermon.durationSeconds ? (
          <span className="absolute right-3 bottom-3 rounded-md bg-plum-950/80 px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
            <span className="sr-only">Duration </span>
            {formatDuration(sermon.durationSeconds)}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-lg leading-snug font-semibold tracking-tight">
          <Link href={sermon.href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {sermon.title}
          </Link>
        </h3>
        {meta.length > 0 && (
          <p className={cn("mt-1.5 text-sm", dark ? "text-plum-300" : "text-plum-950/60")}>{meta.join("  ·  ")}</p>
        )}
        {sermon.scripture && (
          <p className={cn("scripture mt-1 text-lg", dark ? "text-plum-200" : "text-plum-700")}>{sermon.scripture}</p>
        )}
        {sermon.description && (
          <p className={cn("mt-2 line-clamp-2 text-sm", dark ? "text-white/65" : "text-plum-950/65")}>
            {sermon.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {hasVideo && (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", dark ? "bg-white/10" : "bg-plum-100 text-plum-700")}>
              <Icon name="play" size={12} /> Video
            </span>
          )}
          {hasAudio && (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", dark ? "bg-white/10" : "bg-plum-100 text-plum-700")}>
              <Icon name="headphones" size={12} />
              Audio
            </span>
          )}
          <SampleBadge show={sermon.isSample} className={dark ? "text-plum-200" : "text-plum-600"} />
        </div>
      </div>
      {/* Focus ring for the whole card (the title link covers it). */}
      <span aria-hidden="true" className="pointer-events-none absolute -inset-2 rounded-[1.9rem] ring-plum-300 group-has-[a:focus-visible]:ring-2" />
    </article>
  );
}
