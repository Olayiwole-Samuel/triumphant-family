import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Database schema — the single source of truth for church content.
 *
 * - Page-level content (Church information, Home page, About page…) lives in
 *   `settings` as one JSON document per page (see src/lib/content/settings.ts
 *   for each shape and its defaults).
 * - Collections (sermons, events, albums, photos, service times, leaders) are
 *   real tables with a `published` switch: unpublished rows are drafts that
 *   only appear in the admin.
 * - Dates are stored as YYYY-MM-DD and times as 24-hour HH:MM wall-clock
 *   strings in the event's own time zone, exactly as entered.
 * - Images are stored as JSON ({ url, alt, width, height, publicId?, … }) —
 *   see `StoredImage` below.
 *
 * Change this file, then run `npm run db:generate` to create a migration.
 */

/** An uploaded image. `publicId` is set for Cloudinary uploads (used to build resized URLs). */
export type StoredImage = {
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  publicId?: string;
  focalPoint?: { x: number; y: number };
};

/** A video linked from YouTube (event recaps and testimonies). */
export type StoredVideo = {
  id: string;
  title: string;
  url: string;
  kind: "sermon" | "highlight" | "worship" | "other";
  speaker?: string;
  note?: string;
};

export type StoredTestimony = {
  id: string;
  name: string;
  kind: "written" | "video";
  /** Written testimony text (written), or an optional short note (video). */
  body?: string;
  videoUrl?: string;
  location?: string;
  published: boolean;
};

export type StoredScheduleItem = { time?: string; title: string; note?: string };

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ------------------------------------------------------------------ Admin */

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  /** scrypt hash — see src/lib/admin/password.ts. The password itself is never stored. */
  passwordHash: text("password_hash").notNull(),
  ...timestamps,
});

export const adminSessions = pgTable(
  "admin_sessions",
  {
    /** SHA-256 of the session token; the token itself only lives in the browser cookie. */
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("admin_sessions_user_idx").on(table.userId)],
);

/** Failed sign-in attempts, used to slow down password guessing. */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    /** Hashed client address — raw IP addresses are not stored. */
    clientKey: text("client_key").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("login_attempts_client_idx").on(table.clientKey, table.attemptedAt)],
);

/* --------------------------------------------------------- Page settings */

export const settings = pgTable("settings", {
  /** "site" | "home" | "about" | "watch" | "events" | "giving" */
  key: text("key").primaryKey(),
  data: jsonb("data").notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* ------------------------------------------------------------ Collections */

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    description: text("description"),
    category: text("category"),
    /** Name shared by every year of a recurring event, e.g. "Annual Holy Ghost Convention". */
    series: text("series"),
    date: date("date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    allDay: boolean("all_day").notNull().default(false),
    startTime: text("start_time"),
    endTime: text("end_time"),
    timezone: text("timezone").notNull().default("Africa/Lagos"),
    format: text("format").$type<"in-person" | "online" | "hybrid">().notNull().default("in-person"),
    location: text("location"),
    address: text("address"),
    mapUrl: text("map_url"),
    onlineUrl: text("online_url"),
    flyer: jsonb("flyer").$type<StoredImage>(),
    registrationRequired: boolean("registration_required").notNull().default(false),
    registrationUrl: text("registration_url"),
    registrationDeadline: date("registration_deadline", { mode: "string" }),
    registrationNote: text("registration_note"),
    moreInfoUrl: text("more_info_url"),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    schedule: jsonb("schedule").$type<StoredScheduleItem[]>().notNull().default(sql`'[]'::jsonb`),
    /* Recap — what happened, for looking back years later */
    recapBody: text("recap_body"),
    recapVideos: jsonb("recap_videos").$type<StoredVideo[]>().notNull().default(sql`'[]'::jsonb`),
    testimonies: jsonb("testimonies").$type<StoredTestimony[]>().notNull().default(sql`'[]'::jsonb`),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("events_slug_idx").on(table.slug), index("events_date_idx").on(table.date)],
);

export const sermons = pgTable(
  "sermons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    speaker: text("speaker"),
    date: date("date", { mode: "string" }).notNull(),
    series: text("series"),
    scripture: text("scripture"),
    otherScriptures: jsonb("other_scriptures").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    topics: jsonb("topics").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    description: text("description"),
    youtubeUrl: text("youtube_url"),
    audioUrl: text("audio_url"),
    audioMimeType: text("audio_mime_type"),
    thumbnail: jsonb("thumbnail").$type<StoredImage>(),
    /** The event this message was preached at (shown in that event's recap). */
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("sermons_slug_idx").on(table.slug), index("sermons_date_idx").on(table.date)],
);

export const galleryAlbums = pgTable(
  "gallery_albums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    date: date("date", { mode: "string" }),
    description: text("description"),
    category: text("category"),
    /** Photos of an event: the album appears on that event's page. */
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    /** Photo id used as the cover (else the first photo). */
    coverPhotoId: uuid("cover_photo_id"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order"),
    published: boolean("published").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("gallery_albums_slug_idx").on(table.slug), index("gallery_albums_event_idx").on(table.eventId)],
);

export const galleryPhotos = pgTable(
  "gallery_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => galleryAlbums.id, { onDelete: "cascade" }),
    image: jsonb("image").$type<StoredImage>().notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("gallery_photos_album_idx").on(table.albumId, table.sortOrder)],
);

export const serviceTimes = pgTable("service_times", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  day: text("day").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  location: text("location"),
  description: text("description"),
  sortOrder: integer("sort_order"),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});

export const leaders = pgTable("leaders", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio"),
  photo: jsonb("photo").$type<StoredImage>(),
  /** Off → the photo stays saved but is never sent to the website. */
  showPhoto: boolean("show_photo").notNull().default(true),
  sortOrder: integer("sort_order"),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});
