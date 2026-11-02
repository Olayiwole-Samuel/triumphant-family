import type { MetadataRoute } from "next";
import { getEventsSnapshot, getSermonArchive } from "@/lib/content";
import { SITE_URL, STATIC_ROUTES } from "@/lib/site";

/**
 * Sitemap: the main pages plus every curated (Sanity) sermon and published event page.
 * YouTube-only pages (/sermons/yt-…) are left out — they change as new
 * videos are uploaded, and point search engines to YouTube anyway.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [archive, events] = await Promise.all([getSermonArchive(), getEventsSnapshot()]);
  const sermons = archive.filter((sermon) => sermon.source === "cms");
  return [
    ...STATIC_ROUTES.map((path) => ({
      url: `${SITE_URL}${path === "/" ? "" : path}`,
      changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "/" ? 1 : 0.7,
    })),
    ...sermons.map((sermon) => ({
      url: `${SITE_URL}${sermon.href}`,
      lastModified: sermon.date,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    ...events.map((event) => ({
      url: `${SITE_URL}${event.href}`,
      changeFrequency: "weekly" as const,
      priority: event.status === "past" ? 0.3 : 0.6,
    })),
  ];
}
