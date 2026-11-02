import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import {
  CHURCH_NAME,
  CHURCH_YOUTUBE_CHANNEL_ID,
  CHURCH_YOUTUBE_CHANNEL_URL,
  MINISTRY_NAME,
} from "@/content/church";
import { getDb, schema } from "@/lib/db";
import type { StoredImage } from "@/lib/db/schema";
import { canAddToCalendar } from "@/lib/events/calendar";
import { filterEvents, parseEventQuery } from "@/lib/events/archive";
import { eventInstants, eventStatus, validTimezone } from "@/lib/events/time";
import { mergeSermonSources } from "@/lib/sermons/archive";
import { titleCaseIfShouting } from "@/lib/utils/format";
import { churchNow } from "@/lib/utils/time";
import { getChannelMedia, type ChannelMedia } from "@/lib/youtube/api";
import { isValidVideoId, type YouTubeVideo } from "@/lib/youtube/parse";
import { getYouTubeThumbnailUrl, getYouTubeVideoId, getYouTubeWatchUrl } from "@/lib/youtube/utils";
import type {
  AboutPage,
  ChurchEvent,
  CmsEvent,
  EventMedia,
  EventsPage,
  GalleryAlbum,
  GivingSettings,
  HomePage,
  Leader,
  MediaImage,
  Sermon,
  ServiceTime,
  SiteSettings,
  WatchPage,
  Weekday,
} from "@/types/content";
import { clean } from "./clean";
import { readSettings } from "./settings";

/**
 * Data access for every public page.
 *
 * - Only PUBLISHED items are shown; drafts stay in the admin.
 * - A page that hasn't been filled in yet falls back to neutral defaults (no
 *   invented facts); an empty list returns [] and the UI shows an empty state.
 * - A failed database request is logged (without content) and treated as
 *   missing — the page still renders.
 *
 * Every function is cached ("use cache") and tagged; saving in the admin
 * expires the matching tag so the change appears immediately. cacheLife is a
 * safety net.
 */

async function query<T>(label: string, run: () => Promise<unknown>): Promise<T | undefined> {
  try {
    return clean<T>(await run());
  } catch (error) {
    // Drizzle wraps driver errors; the cause holds the useful part (never content).
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined;
    const reason = cause ?? (error instanceof Error ? error.message.split("\n")[0] : "unknown error");
    console.error(`[content] Could not load ${label}: ${reason}`);
    return undefined;
  }
}

/** Stored image → website image (storage details such as publicId stay on the server). */
function toMedia(image?: StoredImage | null): MediaImage | undefined {
  if (!image?.url) return undefined;
  return {
    url: image.url,
    alt: image.alt ?? "",
    caption: image.caption,
    width: image.width,
    height: image.height,
    focalPoint: image.focalPoint,
  };
}

const toMediaList = (images?: StoredImage[] | null) =>
  (images ?? []).map(toMedia).filter((image): image is MediaImage => Boolean(image));

/* ---------------------------------------------------------------- Settings */

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("siteSettings");

  const site = (await query<Awaited<ReturnType<typeof readSettings<"site">>>>("church information", () =>
    readSettings("site"),
  )) ?? {};
  return {
    ...site,
    churchName: site.churchName || CHURCH_NAME,
    ministryName: site.ministryName || MINISTRY_NAME,
    logo: toMedia(site.logo),
    shareImage: toMedia(site.shareImage),
    youtubeChannelUrl: site.youtubeChannelUrl || CHURCH_YOUTUBE_CHANNEL_URL,
    youtubeChannelId: site.youtubeChannelId || CHURCH_YOUTUBE_CHANNEL_ID,
    socialLinks: (site.socialLinks ?? []).filter((link) => link.url),
    beliefs: (site.beliefs ?? []).filter((belief) => belief.title),
  };
}

const DEFAULT_HOME_PAGE: HomePage = {
  heroEyebrow: MINISTRY_NAME,
  heroTitle: "A FAMILY OF FAITH. A PEOPLE OF PURPOSE.",
  primaryCta: { label: "Watch & Listen", href: "/watch" },
  secondaryCta: { label: "Discover Our Family", href: "/about" },
  galleryHighlights: [],
};

export async function getHomePage(): Promise<HomePage> {
  "use cache";
  cacheLife("hours");
  cacheTag("homePage", "event");

  const home = (await query<Awaited<ReturnType<typeof readSettings<"home">>>>("home page", () =>
    readSettings("home"),
  )) ?? {};
  let featuredEventSlug: string | undefined;
  if (home.featuredEventId) {
    const rows = await query<{ slug: string }[]>("featured event", () =>
      getDb()
        .select({ slug: schema.events.slug })
        .from(schema.events)
        .where(and(eq(schema.events.id, home.featuredEventId!), eq(schema.events.published, true)))
        .limit(1),
    );
    featuredEventSlug = rows?.[0]?.slug;
  }
  return {
    ...DEFAULT_HOME_PAGE,
    heroEyebrow: home.heroEyebrow || DEFAULT_HOME_PAGE.heroEyebrow,
    heroTitle: home.heroTitle || DEFAULT_HOME_PAGE.heroTitle,
    heroSubtitle: home.heroSubtitle,
    heroImage: toMedia(home.heroImage),
    primaryCta: home.primaryCta?.label && home.primaryCta.href ? home.primaryCta : DEFAULT_HOME_PAGE.primaryCta,
    secondaryCta:
      home.secondaryCta?.label && home.secondaryCta.href ? home.secondaryCta : DEFAULT_HOME_PAGE.secondaryCta,
    welcomeHeading: home.welcomeHeading,
    welcomeStatement: home.welcomeStatement,
    welcomeBody: home.welcomeBody,
    welcomeImage: toMedia(home.welcomeImage),
    scriptureText: home.scriptureText,
    scriptureReference: home.scriptureReference,
    galleryHighlights: toMediaList(home.galleryHighlights),
    featuredEventSlug,
  };
}

export async function getAboutPage(): Promise<AboutPage> {
  "use cache";
  cacheLife("hours");
  cacheTag("aboutPage");

  const about = (await query<Awaited<ReturnType<typeof readSettings<"about">>>>("about page", () =>
    readSettings("about"),
  )) ?? {};
  return {
    ...about,
    heroTitle: about.heroTitle || "About our family",
    heroImage: toMedia(about.heroImage),
    storyImages: toMediaList(about.storyImages),
  };
}

export async function getGivingSettings(): Promise<GivingSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("givingSettings");

  const giving = (await query<Awaited<ReturnType<typeof readSettings<"giving">>>>("giving", () =>
    readSettings("giving"),
  )) ?? {};
  return {
    ...giving,
    active: giving.active !== false,
    categories: (giving.categories ?? []).filter((category) => category.title),
  };
}

/* ------------------------------------------------------------- Collections */

export async function getServiceTimes(): Promise<ServiceTime[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("serviceTime");

  const t = schema.serviceTimes;
  const rows = await query<ServiceTime[]>("service times", () =>
    getDb()
      .select({
        id: t.id,
        title: t.title,
        day: t.day,
        startTime: t.startTime,
        endTime: t.endTime,
        location: t.location,
        description: t.description,
      })
      .from(t)
      .where(eq(t.published, true))
      .orderBy(sql`${t.sortOrder} asc nulls last`, asc(t.startTime)),
  );
  return (rows ?? []).map((row) => ({ ...row, day: row.day as Weekday }));
}

export async function getLeaders(): Promise<Leader[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("leader");

  const t = schema.leaders;
  const rows = await query<Array<Omit<Leader, "photo"> & { photo?: StoredImage; showPhoto: boolean }>>(
    "leaders",
    () =>
      getDb()
        .select({ id: t.id, name: t.name, role: t.role, bio: t.bio, photo: t.photo, showPhoto: t.showPhoto })
        .from(t)
        .where(eq(t.published, true))
        .orderBy(sql`${t.sortOrder} asc nulls last`, asc(t.name)),
  );
  // "Show photo" off → the photo is never sent to the website.
  return (rows ?? []).map(({ photo, showPhoto, ...leader }) => ({
    ...leader,
    photo: showPhoto ? toMedia(photo) : undefined,
  }));
}

/* ----------------------------------------------------------------- Sermons */

type SermonRow = typeof schema.sermons.$inferSelect;

function fromCms(row: SermonRow): Sermon {
  const sermon = clean<SermonRow>(row);
  const videoId = getYouTubeVideoId(sermon.youtubeUrl);
  return {
    id: sermon.id,
    title: sermon.title,
    slug: sermon.slug,
    speaker: sermon.speaker ?? undefined,
    date: sermon.date,
    series: sermon.series ?? undefined,
    scripture: sermon.scripture ?? undefined,
    otherScriptures: sermon.otherScriptures ?? [],
    topics: sermon.topics ?? [],
    description: sermon.description ?? undefined,
    youtubeVideoId: videoId,
    youtubeUrl: videoId ? getYouTubeWatchUrl(videoId) : undefined,
    thumbnail:
      toMedia(sermon.thumbnail) ??
      (videoId ? { url: getYouTubeThumbnailUrl(videoId), alt: "", width: 480, height: 360 } : undefined),
    audioUrl: sermon.audioUrl ?? undefined,
    audioMimeType: sermon.audioMimeType ?? undefined,
    featured: sermon.featured,
    eventId: sermon.eventId ?? undefined,
    source: "cms",
    href: `/sermons/${sermon.slug}`,
  };
}

/** A YouTube upload shown in the archive. Only real API/RSS fields — nothing inferred. */
function fromYouTube(video: YouTubeVideo): Sermon {
  return {
    id: `youtube-${video.videoId}`,
    title: titleCaseIfShouting(video.title.replace(/\s+\|\s+/g, " · ")),
    slug: `yt-${video.videoId}`,
    date: video.publishedAt,
    description: video.description || undefined,
    youtubeVideoId: video.videoId,
    youtubeUrl: getYouTubeWatchUrl(video.videoId),
    thumbnail: { url: video.thumbnailUrl, alt: "", width: 480, height: 360 },
    durationSeconds: video.durationSeconds,
    embeddable: video.embeddable,
    otherScriptures: [],
    topics: [],
    source: "youtube",
    href: `/sermons/yt-${video.videoId}`,
  };
}

/** Every published sermon (newest 500), shared by the archive, home and event pages. */
async function getCmsSermons(): Promise<Sermon[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("sermon");

  const t = schema.sermons;
  const rows = await query<SermonRow[]>("sermons", () =>
    getDb().select().from(t).where(eq(t.published, true)).orderBy(desc(t.date), desc(t.createdAt)).limit(500),
  );
  return (rows ?? []).map(fromCms);
}

/** The featured sermon: Home page pick → newest marked "Feature this" → newest. */
export async function getFeaturedSermon(): Promise<Sermon | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("sermon", "homePage");

  const [sermons, home] = await Promise.all([
    getCmsSermons(),
    query<{ featuredSermonId?: string }>("home page", () => readSettings("home")),
  ]);
  return (
    sermons.find((sermon) => sermon.id === home?.featuredSermonId) ??
    sermons.find((sermon) => sermon.featured) ??
    sermons[0]
  );
}

export async function getLatestSermons(limit = 6): Promise<Sermon[]> {
  return (await getCmsSermons()).slice(0, limit);
}

/* ------------------------------------------------------------------ Watch */

const DEFAULT_WATCH_HEADING = "WATCH & EXPERIENCE";

export async function getWatchPage(): Promise<WatchPage> {
  "use cache";
  cacheLife("hours");
  cacheTag("watchPage");

  const page = (await query<Awaited<ReturnType<typeof readSettings<"watch">>>>("watch page", () =>
    readSettings("watch"),
  )) ?? {};
  const featuredVideoId = getYouTubeVideoId(page.featuredVideoUrl);
  const manualVideoId = getYouTubeVideoId(page.manualStreamUrl);
  return {
    heading: page.heading || DEFAULT_WATCH_HEADING,
    intro: page.intro,
    featuredVideoId,
    featuredVideoTitle: page.featuredVideoTitle,
    // Only a valid YouTube link is ever used as a manual fallback.
    manualStreamUrl: manualVideoId ? page.manualStreamUrl : undefined,
    manualStreamVideoId: manualVideoId,
    manualStreamNote: page.manualStreamNote,
    useYouTubeApi: page.useYouTubeApi !== false,
  };
}

/**
 * Recent uploads + live status for the church channel (Church information →
 * YouTube channel ID). Shared cache: one YouTube refresh serves the whole site.
 */
export async function getSiteChannelMedia(): Promise<ChannelMedia> {
  const [settings, watch] = await Promise.all([getSiteSettings(), getWatchPage()]);
  const channelId = settings.youtubeChannelId;
  if (!channelId) return { videos: [], source: "none", liveStatus: { state: "not_configured" } };
  return getChannelMedia(channelId, watch.useYouTubeApi);
}

/** Watchable uploads only — scheduled (not yet started) and in-progress broadcasts are excluded. */
function watchable(video: YouTubeVideo) {
  return video.liveBroadcastContent !== "upcoming" && video.liveBroadcastContent !== "live";
}

/** The church's latest real uploads, newest first. */
export async function getYouTubeUploads(limit = 3): Promise<Sermon[]> {
  const media = await getSiteChannelMedia();
  return media.videos.filter(watchable).slice(0, limit).map(fromYouTube);
}

/**
 * The full archive: admin sermons + recent YouTube uploads not linked to an
 * admin sermon (matched by video ID — see lib/sermons/archive.ts).
 */
export async function getSermonArchive(): Promise<Sermon[]> {
  const [cms, media] = await Promise.all([getCmsSermons(), getSiteChannelMedia()]);
  return mergeSermonSources(cms, media.videos.filter(watchable).map(fromYouTube));
}

/** A sermon by slug: an admin sermon, or "yt-<videoId>" for a recent YouTube upload. */
export async function getSermonBySlug(slug: string): Promise<Sermon | undefined> {
  if (slug.startsWith("yt-")) {
    const videoId = slug.slice(3);
    if (!isValidVideoId(videoId)) return undefined;
    const cms = await getCmsSermons();
    // If the church has added this video as a sermon, that page is the canonical one.
    const curated = cms.find((sermon) => sermon.youtubeVideoId === videoId);
    if (curated) return curated;
    const media = await getSiteChannelMedia();
    const video = media.videos.find((v) => v.videoId === videoId && watchable(v));
    return video ? fromYouTube(video) : undefined;
  }
  if (!/^[a-z0-9-]{1,96}$/i.test(slug)) return undefined;
  return (await getCmsSermons()).find((sermon) => sermon.slug === slug);
}

/* ----------------------------------------------------------------- Events */

type EventRow = typeof schema.events.$inferSelect;

function fromEventRow(row: EventRow): CmsEvent {
  const event = clean<EventRow>(row);
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    summary: event.summary ?? undefined,
    description: event.description ?? undefined,
    category: event.category ?? undefined,
    series: event.series ?? undefined,
    date: event.date ?? undefined,
    endDate: event.endDate ?? undefined,
    allDay: event.allDay,
    startTime: event.allDay ? undefined : (event.startTime ?? undefined),
    endTime: event.allDay ? undefined : (event.endTime ?? undefined),
    timezone: event.timezone || "Africa/Lagos",
    format: event.format || "in-person",
    location: event.location ?? undefined,
    address: event.address ?? undefined,
    mapUrl: event.mapUrl ?? undefined,
    onlineUrl: event.onlineUrl ?? undefined,
    flyer: toMedia(event.flyer),
    registrationRequired: event.registrationRequired,
    registrationUrl: event.registrationUrl ?? undefined,
    registrationDeadline: event.registrationDeadline ?? undefined,
    registrationNote: event.registrationNote ?? undefined,
    moreInfoUrl: event.moreInfoUrl ?? undefined,
    contactName: event.contactName ?? undefined,
    contactEmail: event.contactEmail ?? undefined,
    contactPhone: event.contactPhone ?? undefined,
    schedule: (event.schedule ?? []).filter((item) => item.title),
    recapBody: event.recapBody ?? undefined,
    recapVideos: (event.recapVideos ?? []).flatMap((video) => {
      const videoId = getYouTubeVideoId(video.url);
      return videoId && video.title ? [{ ...video, videoId }] : [];
    }),
    // Only testimonies switched to "Show on website".
    testimonies: (event.testimonies ?? []).flatMap((testimony) => {
      if (!testimony.published || !testimony.name) return [];
      const videoId = testimony.kind === "video" ? getYouTubeVideoId(testimony.videoUrl) : undefined;
      if (testimony.kind === "video" ? !videoId : !testimony.body) return [];
      return [
        {
          id: testimony.id,
          name: testimony.name,
          kind: testimony.kind,
          body: testimony.body,
          videoId,
          location: testimony.location,
        },
      ];
    }),
    featured: event.featured,
  };
}

function toChurchEvent(event: CmsEvent, now: number): ChurchEvent {
  const instants = eventInstants(event);
  return {
    ...event,
    status: eventStatus(event, now),
    startsAt: instants ? new Date(instants.start).toISOString() : undefined,
    endsAt: instants?.end ? new Date(instants.end).toISOString() : undefined,
    calendarReady: canAddToCalendar(event),
    registrationClosed: Boolean(
      event.registrationDeadline &&
        event.registrationDeadline < churchNow(new Date(now), validTimezone(event.timezone)).date,
    ),
    href: `/events/${event.slug}`,
  };
}

/**
 * Every published event with its computed status (upcoming / past / TBA),
 * judged against the current time in each event's own time zone. Cached for
 * minutes so events move to "past" soon after they finish.
 */
export async function getEventsSnapshot(): Promise<ChurchEvent[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("event");

  const now = Date.now();
  const t = schema.events;
  const rows = await query<EventRow[]>("events", () =>
    getDb()
      .select()
      .from(t)
      .where(eq(t.published, true))
      .orderBy(sql`${t.date} desc nulls first`)
      .limit(1000),
  );
  return (rows ?? []).map((row) => toChurchEvent(fromEventRow(row), now));
}

/** Upcoming events (soonest first), then "date to be announced". */
export async function getUpcomingEvents(limit = 6): Promise<ChurchEvent[]> {
  const events = await getEventsSnapshot();
  return filterEvents(events, parseEventQuery({})).slice(0, limit);
}

export async function getEventBySlug(slug: string): Promise<ChurchEvent | undefined> {
  if (!/^[a-z0-9-]{1,96}$/i.test(slug)) return undefined;
  return (await getEventsSnapshot()).find((event) => event.slug === slug);
}

/** Every year of a recurring event, newest first (the series is matched case-insensitively). */
export async function getEventSeries(series: string): Promise<ChurchEvent[]> {
  const key = series.trim().toLowerCase();
  return (await getEventsSnapshot())
    .filter((event) => event.series?.trim().toLowerCase() === key)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

/** Photos (from published albums linked to the event) and sermons preached at it. */
export async function getEventMedia(eventId: string): Promise<EventMedia> {
  "use cache";
  cacheLife("hours");
  cacheTag("galleryAlbum", "sermon");

  const albums = await query<{ id: string; slug: string }[]>("event albums", () =>
    getDb()
      .select({ id: schema.galleryAlbums.id, slug: schema.galleryAlbums.slug })
      .from(schema.galleryAlbums)
      .where(and(eq(schema.galleryAlbums.eventId, eventId), eq(schema.galleryAlbums.published, true)))
      .orderBy(asc(schema.galleryAlbums.createdAt)),
  );
  const albumIds = (albums ?? []).map((album) => album.id);
  const photoRows = albumIds.length
    ? await query<{ image: StoredImage }[]>("event photos", () =>
        getDb()
          .select({ image: schema.galleryPhotos.image })
          .from(schema.galleryPhotos)
          .where(inArray(schema.galleryPhotos.albumId, albumIds))
          .orderBy(asc(schema.galleryPhotos.sortOrder), asc(schema.galleryPhotos.createdAt))
          .limit(400),
      )
    : [];
  const sermons = (await getCmsSermons()).filter((sermon) => sermon.eventId === eventId);
  return {
    photos: toMediaList((photoRows ?? []).map((row) => row.image)),
    albumSlug: albums?.[0]?.slug,
    sermons,
  };
}

export async function getEventsPage(): Promise<EventsPage> {
  "use cache";
  cacheLife("hours");
  cacheTag("eventsPage");

  const page = (await query<Awaited<ReturnType<typeof readSettings<"events">>>>("events page", () =>
    readSettings("events"),
  )) ?? {};
  return { heading: page.heading || "GATHER. GROW. BELONG.", intro: page.intro };
}

/* ---------------------------------------------------------------- Gallery */

type AlbumRow = typeof schema.galleryAlbums.$inferSelect;

/** Published albums that have photos. Featured first, then display order, then newest. */
export async function getGalleryAlbums(limit = 8, imagesPerAlbum = 12): Promise<GalleryAlbum[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("galleryAlbum", "event");

  const a = schema.galleryAlbums;
  const albums = await query<Array<AlbumRow & { eventTitle?: string }>>("gallery albums", () =>
    getDb()
      .select({
        id: a.id,
        title: a.title,
        slug: a.slug,
        date: a.date,
        description: a.description,
        category: a.category,
        sortOrder: a.sortOrder,
        featured: a.featured,
        coverPhotoId: a.coverPhotoId,
        eventTitle: schema.events.title,
      })
      .from(a)
      .leftJoin(schema.events, eq(a.eventId, schema.events.id))
      .where(eq(a.published, true))
      .orderBy(desc(a.featured), sql`${a.sortOrder} asc nulls last`, sql`${a.date} desc nulls last`),
  );
  if (!albums?.length) return [];

  const photos =
    (await query<{ id: string; albumId: string; image: StoredImage }[]>("album photos", () =>
      getDb()
        .select({ id: schema.galleryPhotos.id, albumId: schema.galleryPhotos.albumId, image: schema.galleryPhotos.image })
        .from(schema.galleryPhotos)
        .where(
          inArray(
            schema.galleryPhotos.albumId,
            albums.map((album) => album.id),
          ),
        )
        .orderBy(asc(schema.galleryPhotos.sortOrder), asc(schema.galleryPhotos.createdAt)),
    )) ?? [];

  return albums
    .map((album) => {
      const own = photos.filter((photo) => photo.albumId === album.id);
      const cover = own.find((photo) => photo.id === album.coverPhotoId) ?? own[0];
      return {
        id: album.id,
        title: album.title,
        slug: album.slug,
        date: album.date ?? undefined,
        description: album.description ?? undefined,
        category: album.category ?? undefined,
        order: album.sortOrder ?? undefined,
        eventTitle: album.eventTitle,
        featured: album.featured,
        coverImage: toMedia(cover?.image),
        images: toMediaList(own.slice(0, imagesPerAlbum).map((photo) => photo.image)),
        imageCount: own.length,
      };
    })
    .filter((album) => album.imageCount > 0)
    .slice(0, limit);
}

/** Photos from the newest featured albums (fallback for the home photo story). */
export async function getAlbumPhotos(): Promise<MediaImage[]> {
  const albums = await getGalleryAlbums(3, 6);
  return albums.flatMap((album) => album.images);
}

/* ------------------------------------------------------- Static generation */

/** Slugs to prerender at build time: admin sermons + recent uploads (bounded). */
export async function getSermonSlugs(): Promise<string[]> {
  const archive = await getSermonArchive();
  return archive.slice(0, 60).map((sermon) => sermon.slug);
}

/** Event slugs to prerender at build time (bounded). */
export async function getEventSlugs(): Promise<string[]> {
  return (await getEventsSnapshot()).slice(0, 100).map((event) => event.slug);
}
