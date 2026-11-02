/**
 * Content types used by the website.
 *
 * These are the shapes the UI works with. src/lib/content maps database rows
 * (src/lib/db/schema.ts) into them, so components never deal with storage
 * details.
 *
 * `isSample` marks sample content; the UI labels it so it is never mistaken
 * for confirmed church information.
 */

/** A provider-agnostic image (Cloudinary, or a local upload during development). */
export type MediaImage = {
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  /** Tiny base64 blur placeholder, when the provider supplies one. */
  blurDataUrl?: string;
  /** Focal point (0–1) chosen by the editor, used as CSS object-position. */
  focalPoint?: { x: number; y: number };
};

export type SocialPlatform =
  | "youtube"
  | "facebook"
  | "instagram"
  | "x"
  | "tiktok"
  | "whatsapp"
  | "other";

export type SocialLink = {
  platform: SocialPlatform;
  url: string;
  label?: string;
};

export type Belief = {
  title: string;
  description?: string;
};

export type SiteSettings = {
  churchName: string;
  ministryName?: string;
  tagline?: string;
  description?: string;
  logo?: MediaImage;
  favicon?: MediaImage;
  shareImage?: MediaImage;
  contactEmail?: string;
  phone?: string;
  address?: string;
  mapUrl?: string;
  officeHours?: string;
  youtubeChannelUrl?: string;
  youtubeChannelId?: string;
  socialLinks: SocialLink[];
  mission?: string;
  vision?: string;
  beliefs: Belief[];
  isSample?: boolean;
};

export type CallToAction = {
  label: string;
  href: string;
};

export type HomePage = {
  heroEyebrow?: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroImage?: MediaImage;
  primaryCta?: CallToAction;
  secondaryCta?: CallToAction;
  welcomeHeading?: string;
  welcomeStatement?: string;
  welcomeBody?: string;
  welcomeImage?: MediaImage;
  scriptureText?: string;
  scriptureReference?: string;
  galleryHighlights: MediaImage[];
  featuredEventSlug?: string;
  isSample?: boolean;
};

export type AboutPage = {
  heroTitle: string;
  heroIntro?: string;
  heroImage?: MediaImage;
  storyHeading?: string;
  storyIntro?: string;
  /** Simple formatted text: paragraphs, **bold**, *italic*, [links](https://…). */
  storyBody?: string;
  storyImages: MediaImage[];
  invitationHeading?: string;
  invitationBody?: string;
  isSample?: boolean;
};

export type Weekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type ServiceTime = {
  id: string;
  title: string;
  day: Weekday;
  /** 24-hour "HH:mm", Africa/Lagos wall-clock time */
  startTime: string;
  /** 24-hour "HH:mm", Africa/Lagos wall-clock time */
  endTime?: string;
  location?: string;
  description?: string;
  isSample?: boolean;
};

export type Leader = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  /** Already filtered: undefined when the editor turned "Show photo" off. */
  photo?: MediaImage;
  isSample?: boolean;
};

/**
 * Where a sermon record came from.
 * - cms: a sermon added in the admin (the editorial source of truth)
 * - youtube: a recent channel upload not (yet) added in the admin
 */
export type SermonSource = "cms" | "youtube";

export type Sermon = {
  id: string;
  title: string;
  slug: string;
  speaker?: string;
  /** ISO date (YYYY-MM-DD or full ISO timestamp) */
  date: string;
  series?: string;
  /** Main scripture reference. */
  scripture?: string;
  otherScriptures: string[];
  topics: string[];
  description?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  thumbnail?: MediaImage;
  /** Uploaded MP3 or an external audio link. */
  audioUrl?: string;
  audioMimeType?: string;
  durationSeconds?: number;
  /** false when embedding is disabled on YouTube (known only via the Data API). */
  embeddable?: boolean;
  featured?: boolean;
  /** The event this message was preached at, if any. */
  eventId?: string;
  source: SermonSource;
  /** Detail page: /sermons/<slug> (admin) or /sermons/yt-<videoId> (YouTube upload). */
  href: string;
  isSample?: boolean;
};

export type EventFormat = "in-person" | "online" | "hybrid";

export type EventScheduleItem = { time?: string; title: string; note?: string };

export type EventVideoKind = "sermon" | "highlight" | "worship" | "other";

/** A video from the event (YouTube), shown in its recap. */
export type EventVideo = {
  id: string;
  title: string;
  url: string;
  videoId: string;
  kind: EventVideoKind;
  speaker?: string;
  note?: string;
};

/** A testimony shared after the event — written, or a YouTube video. */
export type EventTestimony = {
  id: string;
  name: string;
  kind: "written" | "video";
  body?: string;
  videoId?: string;
  location?: string;
};

/** An event as stored (see src/lib/db/schema.ts → events). */
export type CmsEvent = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  category?: string;
  /** Shared name of a recurring event (e.g. a yearly convention) — links the years together. */
  series?: string;
  /** Start date, YYYY-MM-DD. Undefined = date to be announced. */
  date?: string;
  /** Last day of a multi-day event, YYYY-MM-DD. */
  endDate?: string;
  allDay?: boolean;
  /** 24-hour HH:mm wall-clock time in `timezone`. */
  startTime?: string;
  endTime?: string;
  /** IANA zone, default Africa/Lagos. */
  timezone: string;
  format: EventFormat;
  /** Venue name. */
  location?: string;
  address?: string;
  mapUrl?: string;
  onlineUrl?: string;
  flyer?: MediaImage;
  registrationRequired?: boolean;
  registrationUrl?: string;
  registrationDeadline?: string;
  registrationNote?: string;
  moreInfoUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  schedule: EventScheduleItem[];
  /** Recap: what happened (simple formatted text). */
  recapBody?: string;
  recapVideos: EventVideo[];
  /** Published testimonies only. */
  testimonies: EventTestimony[];
  featured?: boolean;
  isSample?: boolean;
};

/** An event as the website uses it: stored data + computed timing. */
export type ChurchEvent = CmsEvent & {
  status: "upcoming" | "past" | "tba";
  /** UTC ISO start/end when known. */
  startsAt?: string;
  endsAt?: string;
  /** False when there's no reliable end (calendar export not offered). */
  calendarReady: boolean;
  /** True once the registration deadline (event time zone) has passed. */
  registrationClosed: boolean;
  href: string;
};

/** Photos and messages attached to an event (loaded for its page). */
export type EventMedia = {
  photos: MediaImage[];
  /** Gallery album holding the photos, when there is one. */
  albumSlug?: string;
  /** Sermons recorded as preached at this event. */
  sermons: Sermon[];
};

export type EventsPage = {
  heading: string;
  intro?: string;
  isSample?: boolean;
};

export type GalleryAlbum = {
  id: string;
  title: string;
  slug: string;
  date?: string;
  description?: string;
  category?: string;
  order?: number;
  eventTitle?: string;
  coverImage?: MediaImage;
  images: MediaImage[];
  imageCount: number;
  featured?: boolean;
  isSample?: boolean;
};

export type GivingCategory = {
  title: string;
  description?: string;
};

export type GivingSettings = {
  active: boolean;
  heading?: string;
  introduction?: string;
  scriptureText?: string;
  scriptureReference?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  additionalInstructions?: string;
  categories: GivingCategory[];
  isSample?: boolean;
};

export type WatchPage = {
  heading: string;
  intro?: string;
  /** Validated YouTube video ID chosen by the editor. */
  featuredVideoId?: string;
  featuredVideoTitle?: string;
  /** Manual fallback link (shown, clearly labelled, when live status can't be verified). */
  manualStreamUrl?: string;
  manualStreamVideoId?: string;
  manualStreamNote?: string;
  /** Editor switch to turn off YouTube Data API calls. */
  useYouTubeApi: boolean;
  isSample?: boolean;
};
