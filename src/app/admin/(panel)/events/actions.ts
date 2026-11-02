"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { FormReader, cleanText, success, type FormState } from "@/lib/admin/form";
import { refreshPublic } from "@/lib/admin/revalidate";
import { requireAdmin } from "@/lib/admin/session";
import { SLUG_PATTERN, slugify, uniqueSlug } from "@/lib/admin/slug";
import { getDb, schema } from "@/lib/db";
import type { StoredScheduleItem, StoredTestimony, StoredVideo } from "@/lib/db/schema";
import { EVENT_TIMEZONES } from "@/lib/events/time";
import { getYouTubeVideoId } from "@/lib/youtube/utils";

const FORMATS = ["in-person", "online", "hybrid"] as const;
const VIDEO_KINDS = ["sermon", "highlight", "worship", "other"] as const;
const ZONES = EVENT_TIMEZONES.map((zone) => zone.value);

type Row = Record<string, unknown>;

function readVideos(form: FormReader): StoredVideo[] {
  const videos: StoredVideo[] = [];
  form.json<Row[]>("recapVideos", []).slice(0, 60).forEach((row, index) => {
    const title = cleanText(row.title, 160);
    const url = cleanText(row.url, 500);
    if (!title && !url) return;
    if (!title) return form.error("recapVideos", `Video ${index + 1} needs a title.`);
    if (!url || !getYouTubeVideoId(url)) return form.error("recapVideos", `Video ${index + 1} (“${title}”) needs a YouTube link.`);
    videos.push({
      id: cleanText(row.id, 60) ?? `video-${index}`,
      title,
      url,
      kind: VIDEO_KINDS.find((kind) => kind === row.kind) ?? "other",
      speaker: cleanText(row.speaker, 120),
      note: cleanText(row.note, 300),
    });
  });
  return videos;
}

function readTestimonies(form: FormReader): StoredTestimony[] {
  const testimonies: StoredTestimony[] = [];
  form.json<Row[]>("testimonies", []).slice(0, 200).forEach((row, index) => {
    const name = cleanText(row.name, 120);
    const kind = row.kind === "video" ? "video" : "written";
    const body = cleanText(row.body, 5000);
    const videoUrl = cleanText(row.videoUrl, 500);
    if (!name && !body && !videoUrl) return;
    const label = `Testimony ${index + 1}${name ? ` (${name})` : ""}`;
    if (!name) return form.error("testimonies", `${label} needs the person's name (or “Anonymous”).`);
    if (kind === "written" && !body) return form.error("testimonies", `${label} has no text yet.`);
    if (kind === "video" && (!videoUrl || !getYouTubeVideoId(videoUrl))) {
      return form.error("testimonies", `${label} needs a YouTube link for the video.`);
    }
    testimonies.push({
      id: cleanText(row.id, 60) ?? `testimony-${index}`,
      name,
      kind,
      body,
      videoUrl: kind === "video" ? videoUrl : undefined,
      location: cleanText(row.location, 120),
      published: row.published === true,
    });
  });
  return testimonies;
}

function readSchedule(form: FormReader): StoredScheduleItem[] {
  return form
    .json<Row[]>("schedule", [])
    .slice(0, 80)
    .map((row) => ({ time: cleanText(row.time, 40), title: cleanText(row.title, 160) ?? "", note: cleanText(row.note, 300) }))
    .filter((item) => item.title);
}

export async function saveEvent(id: string | null, _state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);

  const title = form.text("title", { label: "Event name", required: true, max: 160 }) ?? "";
  const date = form.date("date", { label: "Start date" });
  const endDate = form.date("endDate", { label: "End date" });
  const allDay = form.bool("allDay");
  const startTime = allDay ? undefined : form.time("startTime", { label: "Start time" });
  const endTime = allDay ? undefined : form.time("endTime", { label: "End time" });
  const format = form.choice("format", FORMATS, "in-person");
  const location = form.text("location", { label: "Venue", max: 160 });
  const onlineUrl = form.url("onlineUrl", { label: "Online link" });
  const registrationRequired = form.bool("registrationRequired");
  const registrationUrl = form.url("registrationUrl", { label: "Registration link" });
  const registrationDeadline = form.date("registrationDeadline", { label: "Registration deadline" });
  const wantedSlug = form.raw("slug").trim();

  if (endDate && !date) form.error("date", "Add the start date first.");
  if (date && endDate && endDate < date) form.error("endDate", "The end date can't be before the start date.");
  if (endTime && !startTime) form.error("startTime", "Add the start time too.");
  const singleDay = !endDate || endDate === date;
  if (startTime && endTime && singleDay && endTime <= startTime) form.error("endTime", "The end time must be after the start time.");
  if (format !== "online" && !location) form.error("location", "Add the venue (or choose “Online”).");
  if (format !== "in-person" && !onlineUrl) form.error("onlineUrl", "Add the link people use to join online.");
  if (registrationRequired && !registrationUrl) form.error("registrationUrl", "Add the registration link (e.g. your Google Form).");
  if (registrationDeadline && date && registrationDeadline > (endDate ?? date)) {
    form.error("registrationDeadline", "The deadline should be on or before the last day of the event.");
  }
  if (wantedSlug && !SLUG_PATTERN.test(wantedSlug)) form.error("slug", "Use lowercase letters, numbers and dashes only.");

  const values = {
    title,
    summary: form.text("summary", { label: "Short summary", max: 300 }) ?? null,
    description: form.text("description", { label: "Full description", max: 20000 }) ?? null,
    category: form.text("category", { label: "Category", max: 60 }) ?? null,
    series: form.text("series", { label: "Yearly event name", max: 120 }) ?? null,
    date: date ?? null,
    endDate: endDate && endDate !== date ? endDate : null,
    allDay,
    startTime: startTime ?? null,
    endTime: endTime ?? null,
    timezone: form.choice("timezone", ZONES, "Africa/Lagos"),
    format,
    location: format === "online" ? null : (location ?? null),
    address: format === "online" ? null : (form.text("address", { label: "Address", max: 400 }) ?? null),
    mapUrl: format === "online" ? null : (form.url("mapUrl", { label: "Map link" }) ?? null),
    onlineUrl: format === "in-person" ? null : (onlineUrl ?? null),
    flyer: form.image("flyer", { label: "Flyer" }) ?? null,
    registrationRequired,
    registrationUrl: registrationRequired ? (registrationUrl ?? null) : null,
    registrationDeadline: registrationRequired ? (registrationDeadline ?? null) : null,
    registrationNote: registrationRequired ? (form.text("registrationNote", { label: "Registration instructions", max: 500 }) ?? null) : null,
    moreInfoUrl: form.url("moreInfoUrl", { label: "More information link" }) ?? null,
    contactName: form.text("contactName", { label: "Contact person", max: 120 }) ?? null,
    contactEmail: form.email("contactEmail", { label: "Contact email" }) ?? null,
    contactPhone: form.text("contactPhone", { label: "Contact phone", max: 40 }) ?? null,
    schedule: readSchedule(form),
    recapBody: form.text("recapBody", { label: "Recap", max: 30000 }) ?? null,
    recapVideos: readVideos(form),
    testimonies: readTestimonies(form),
    featured: form.bool("featured"),
    published: form.raw("intent") === "publish",
  };
  if (!form.ok) return form.fail();

  const db = getDb();
  // Recurring events share a name, so the year keeps each page's address distinct.
  const base = wantedSlug || [title, date?.slice(0, 4)].filter(Boolean).join(" ");
  const slug = await uniqueSlug(schema.events, base, id ?? undefined);
  if (id) {
    await db.update(schema.events).set({ ...values, slug }).where(eq(schema.events.id, id));
  } else {
    const [row] = await db.insert(schema.events).values({ ...values, slug }).returning({ id: schema.events.id });
    id = row.id;
  }
  refreshPublic("event", "galleryAlbum");
  if (!data.get("existing")) redirect(`/admin/events/${id}?saved=1`);
  return success(values.published ? "Event saved and published." : "Saved as a draft — it isn't on the website yet.");
}

export async function deleteEvent(id: string) {
  await requireAdmin();
  // Photos stay in the gallery (their album is simply no longer linked to an event).
  await getDb().delete(schema.events).where(eq(schema.events.id, id));
  refreshPublic("event", "galleryAlbum", "sermon", "homePage");
  redirect("/admin/events");
}

/** Creates (or finds) the photo album for an event, so photos can be added on the event screen. */
export async function ensureEventAlbum(eventId: string): Promise<string> {
  await requireAdmin();
  const db = getDb();
  const [existing] = await db
    .select({ id: schema.galleryAlbums.id })
    .from(schema.galleryAlbums)
    .where(eq(schema.galleryAlbums.eventId, eventId))
    .limit(1);
  if (existing) return existing.id;

  const [event] = await db
    .select({ title: schema.events.title, date: schema.events.date, category: schema.events.category })
    .from(schema.events)
    .where(and(eq(schema.events.id, eventId)))
    .limit(1);
  if (!event) throw new Error("Event not found");
  const title = event.date && !event.title.includes(event.date.slice(0, 4)) ? `${event.title} ${event.date.slice(0, 4)}` : event.title;
  const [album] = await db
    .insert(schema.galleryAlbums)
    .values({
      title,
      slug: await uniqueSlug(schema.galleryAlbums, slugify(title)),
      date: event.date,
      category: event.category,
      eventId,
      published: true,
    })
    .returning({ id: schema.galleryAlbums.id });
  refreshPublic("galleryAlbum");
  return album.id;
}
