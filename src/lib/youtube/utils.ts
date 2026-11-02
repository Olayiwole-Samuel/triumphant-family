/**
 * Pure YouTube helpers. Safe to import anywhere (server, client, Studio).
 */

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts the 11-character video ID from any common YouTube link:
 * watch?v=, youtu.be/, /embed/, /shorts/, /live/ — or a bare ID.
 */
export function getYouTubeVideoId(input?: string | null): string | undefined {
  if (!input) return undefined;
  const value = input.trim();
  if (VIDEO_ID.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\.|^m\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return VIDEO_ID.test(id) ? id : undefined;
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && VIDEO_ID.test(v)) return v;

      const [, kind, id] = url.pathname.split("/");
      if (["embed", "shorts", "live", "v"].includes(kind) && id && VIDEO_ID.test(id)) {
        return id;
      }
    }
  } catch {
    // Not a URL — fall through.
  }
  return undefined;
}

export type YouTubeThumbnailQuality = "hqdefault" | "sddefault" | "maxresdefault";

/** maxresdefault is not generated for every video; hqdefault always exists. */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: YouTubeThumbnailQuality = "hqdefault",
): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Privacy-enhanced embed URL (no cookies until the visitor presses play). */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}
