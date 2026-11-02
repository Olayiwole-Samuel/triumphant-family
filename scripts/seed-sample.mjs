#!/usr/bin/env node
/**
 * Fills the admin with SAMPLE content, so every page of the website can be
 * seen working before the real content is ready.
 *
 *   npm run seed:sample            fill every EMPTY field with sample text and add
 *                                  sample sermons, events, albums, service times
 *                                  and leaders. Nothing you entered is changed.
 *   npm run seed:sample -- --clear remove exactly what this script added (your
 *                                  own content and login are kept). Sample text
 *                                  you've since edited is kept too.
 *
 * Runs on the LOCAL database only (never on the live site). Sample text is
 * clearly marked ("sample", example.org, "SAMPLE BANK") so it can't be
 * mistaken for real church information. Photos are generated artwork saved in
 * .data/uploads. Videos are the church channel's real recent YouTube uploads
 * (fetched from YouTube's public feed) when available.
 */
import { randomBytes } from "node:crypto";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const require = createRequire(import.meta.url);
const postgres = require("postgres");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UPLOADS = path.join(root, ".data", "uploads");
const CHANNEL_ID = "UCWehoRiDVFyMsqC9Gf9iAdQ";

const url = process.env.DATABASE_URL ?? "";
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  console.error("Sample content can only be added to the local database (not the live site).");
  process.exit(1);
}
const db = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
/** The connection in use — inside the seeding transaction it is the transaction. */
let sql = db;

/* ------------------------------------------------------------ Clearing */

const MARKER = "sampleContent";
const [markerRow] = await sql`select data from settings where key = ${MARKER}`;
const added = markerRow?.data ?? null;

if (process.argv.includes("--clear")) {
  if (!added) {
    console.log("\nThere is no sample content to remove.\n");
    await sql.end();
    process.exit(0);
  }
  for (const [table, ids] of Object.entries(added.rows)) {
    if (ids.length) await sql.unsafe(`delete from ${table} where id = any($1::uuid[])`, [ids]);
  }
  // Page texts: remove a sample value only if it hasn't been edited since.
  for (const [key, fields] of Object.entries(added.settings)) {
    const [row] = await sql`select data from settings where key = ${key}`;
    if (!row) continue;
    const data = { ...row.data };
    for (const [field, value] of Object.entries(fields)) {
      if (JSON.stringify(data[field]) === JSON.stringify(value)) delete data[field];
    }
    await sql`update settings set data = ${sql.json(data)} where key = ${key}`;
  }
  let removed = 0;
  try {
    for (const name of readdirSync(UPLOADS)) {
      if (name.startsWith("sample-")) {
        rmSync(path.join(UPLOADS, name));
        removed++;
      }
    }
  } catch {
    // no uploads folder
  }
  await sql`delete from settings where key = ${MARKER}`;
  console.log(`\nSample content removed (${removed} sample images). Your own content and login are unchanged.\nRestart \`npm run dev\` to see the result.\n`);
  await sql.end();
  process.exit(0);
}

if (added) {
  console.error("\nSample content was already added. To remove it: npm run seed:sample -- --clear\n");
  await sql.end();
  process.exit(1);
}

/** Everything this run adds, so --clear can remove exactly that. */
const record = { rows: { gallery_albums: [], sermons: [], events: [], service_times: [], leaders: [] }, settings: {} };

/* ------------------------------------------------------- Sample images */

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
const mix = (a, b, t) => a + (b - a) * t;
const PALETTES = [
  [[26, 6, 20], [123, 45, 94], [217, 162, 39]], // night → logo purple → gold glow
  [[45, 14, 35], [151, 80, 123], [242, 166, 208]],
  [[68, 23, 53], [123, 45, 94], [234, 213, 226]],
  [[26, 6, 20], [95, 33, 73], [183, 125, 159]],
];
/** A soft, photographic-feeling gradient with a light "gleam" — clearly artwork, not a photo. */
function samplePng(width, height, seed) {
  const [dark, mid, light] = PALETTES[seed % PALETTES.length];
  const cx = 0.3 + ((seed * 37) % 40) / 100;
  const cy = 0.25 + ((seed * 53) % 40) / 100;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const base = Math.min(1, Math.max(0, 0.15 + u * 0.35 + v * 0.5));
      const dist = Math.hypot(u - cx, (v - cy) * (height / width));
      const glow = Math.max(0, 1 - dist * 2.6) ** 2;
      const i = y * (width * 3 + 1) + 1 + x * 3;
      for (let c = 0; c < 3; c++) {
        const tone = base < 0.5 ? mix(dark[c], mid[c], base * 2) : mix(mid[c], light[c] * 0.6 + mid[c] * 0.4, (base - 0.5) * 2);
        raw[i + c] = Math.round(mix(tone, light[c], glow * 0.85));
      }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
let imageCount = 0;
const createdFiles = [];
function image(alt, width = 1200, height = 800) {
  mkdirSync(UPLOADS, { recursive: true });
  const name = `sample-${randomBytes(6).toString("hex")}.png`;
  writeFileSync(path.join(UPLOADS, name), samplePng(width, height, imageCount++));
  createdFiles.push(path.join(UPLOADS, name));
  return { url: `/uploads/${name}`, alt: `${alt} (sample image)`, width, height };
}

/* ------------------------------------------------- Real YouTube uploads */

async function channelVideos() {
  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(String(response.status));
    const xml = await response.text();
    return [...xml.matchAll(/<yt:videoId>([\w-]{11})<\/yt:videoId>/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}
const videos = await channelVideos();
const FALLBACK_VIDEO = "QQk3bUNf3qo"; // a real upload on the church channel
const video = (index) => `https://www.youtube.com/watch?v=${videos.length ? videos[index % videos.length] : FALLBACK_VIDEO}`;

/* ------------------------------------------------------------- Helpers */

const day = (offset) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
const id = () => `sample-${randomBytes(4).toString("hex")}`;
const isEmpty = (value) => value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
/** Adds sample values only to fields that are empty — anything already entered is left alone. */
async function setting(key, sample) {
  const [row] = await sql`select data from settings where key = ${key}`;
  const current = row?.data ?? {};
  const fill = Object.fromEntries(Object.entries(sample).filter(([field]) => isEmpty(current[field])));
  if (!Object.keys(fill).length) return;
  record.settings[key] = fill;
  await sql`insert into settings (key, data) values (${key}, ${sql.json({ ...current, ...fill })})
    on conflict (key) do update set data = excluded.data, updated_at = now()`;
}

// Everything below runs in ONE transaction: if anything fails, nothing is added.
try {
  await db.begin(async (tx) => {
    sql = tx;

/* ------------------------------------------------------- Page settings */

const logo = image("The Triumphant Family logo", 600, 600);
await setting("site", {
  churchName: "The Triumphant Family",
  ministryName: "The Gleam of Salvation Apostolic Ministry",
  tagline: "A family of faith. A people of purpose.",
  description: "Sample description — a place to encounter God, grow in faith and find your spiritual family, in person or online.",
  logo,
  shareImage: image("Worship at The Triumphant Family", 1200, 630),
  contactEmail: "hello@example.org",
  phone: "+234 800 000 0000",
  address: "1 Sample Street (replace)\nLagos, Nigeria",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Lagos%2C%20Nigeria",
  officeHours: "Monday–Friday, 9am–4pm (sample)",
  youtubeChannelUrl: "https://www.youtube.com/@pastorola1790",
  youtubeChannelId: CHANNEL_ID,
  socialLinks: [
    { platform: "youtube", url: "https://www.youtube.com/@pastorola1790" },
    { platform: "facebook", url: "https://www.facebook.com/" },
    { platform: "instagram", url: "https://www.instagram.com/" },
  ],
  mission: "Sample mission — to raise a family of believers who walk in the light of salvation and the victory of Christ.",
  vision: "Sample vision — a church family, online and in person, carrying the gleam of salvation to every nation.",
  beliefs: [
    { title: "The authority of Scripture", description: "Sample — the Bible is God's inspired Word and our guide for life." },
    { title: "Salvation through Jesus Christ", description: "Sample — by grace through faith, not by works." },
    { title: "The power of the Holy Spirit", description: "Sample — present and active in the believer and the Church today." },
    { title: "The Church as a family", description: "Sample — we belong to one another and grow together." },
  ],
});

await setting("home", {
  heroEyebrow: "The Gleam of Salvation Apostolic Ministry",
  heroTitle: "A FAMILY OF FAITH. A PEOPLE OF PURPOSE.",
  heroSubtitle: "Sample introduction — a place to encounter God, grow in faith and find your spiritual family, wherever in the world you are joining from.",
  heroImage: image("The congregation worshipping", 1600, 1000),
  primaryCta: { label: "Watch & Listen", href: "/watch" },
  secondaryCta: { label: "Discover Our Family", href: "/about" },
  welcomeHeading: "Welcome home",
  welcomeStatement: "Gathered in worship, grounded in the Word, and sent to shine the light of salvation.",
  welcomeBody: "Sample welcome message — whether you're visiting for the first time or joining online from far away, there's a place for you in this family. Come as you are.",
  welcomeImage: image("Members greeting each other", 900, 1100),
  scriptureText: "Now thanks be unto God, which always causeth us to triumph in Christ, and maketh manifest the savour of his knowledge by us in every place.",
  scriptureReference: "2 Corinthians 2:14 (KJV)",
  galleryHighlights: [],
});

await setting("about", {
  heroTitle: "Rooted in grace. Growing together.",
  heroIntro: "Sample introduction — The Triumphant Family is a ministry of The Gleam of Salvation Apostolic Ministry: a family of believers gathered in Lagos and online around the world.",
  heroImage: image("The church building at sunset", 1600, 1000),
  storyHeading: "Our story",
  storyIntro: "Sample story — it began with a small group gathered in prayer.",
  storyBody:
    "This is **sample text** — replace it in the admin under *About page* with the real history of the ministry.\n\n## How it began\nTell how the ministry started, the people God used, and the early days.\n\n> Now thanks be unto God, which always causeth us to triumph in Christ.\n\n## Where we're going\n- Reaching our city with the Gospel\n- Raising leaders\n- Serving our members online around the world",
  storyImages: [image("Early days of the ministry", 900, 1100), image("The church family today", 900, 1100)],
  invitationHeading: "There is a place for you here",
  invitationBody: "Sample invitation — join us this Sunday, in person or online. We'd love to meet you.",
});

await setting("watch", {
  heading: "WATCH & EXPERIENCE",
  intro: "Sample introduction — join our services live, or catch up on recent messages.",
  useYouTubeApi: true,
});

await setting("events", {
  heading: "GATHER. GROW. BELONG.",
  intro: "Sample introduction — services, conferences and gatherings. Look back on past events, too.",
});

await setting("giving", {
  active: true,
  heading: "Partner with what God is doing",
  introduction: "Sample text — your giving supports worship, teaching, outreach and care for the church family.",
  scriptureText: "Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.",
  scriptureReference: "2 Corinthians 9:7 (KJV)",
  bankName: "SAMPLE BANK — replace",
  accountName: "Sample Account Name",
  accountNumber: "0123456789",
  additionalInstructions: "Sample — use your name and “Tithe” or “Offering” as the transfer reference.",
  categories: [
    { title: "Tithes", description: "Sample — honouring God with the first tenth." },
    { title: "Offerings", description: "Sample — freewill giving for the work of the ministry." },
    { title: "Building fund", description: "Sample — towards our church home." },
  ],
});

/* ------------------------------------------------- Service times, leaders */

await sql`insert into service_times (title, day, start_time, end_time, location, description, sort_order, published) values
  ('Sunday Worship Experience', 'sunday', '09:00', '11:30', 'Main Auditorium & Online', 'Sample — worship, the Word and fellowship.', 1, true),
  ('Midweek Bible Study', 'wednesday', '18:00', '19:30', 'Church Auditorium & Online', 'Sample — going deeper in the Word together.', 2, true),
  ('Friday Prayer Meeting', 'friday', '18:00', '20:00', 'Main Auditorium', 'Sample — an evening of prayer.', 3, true)
  returning id`.then((rows) => record.rows.service_times.push(...rows.map((r) => r.id)));

const leaders = [
  ["Pastor (sample name)", "Senior Pastor"],
  ["Pastor (sample name)", "Associate Pastor"],
  ["Minister (sample name)", "Youth Pastor"],
  ["Deaconess (sample name)", "Women's Ministry Leader"],
];
for (const [index, [name, role]] of leaders.entries()) {
  await sql`insert into leaders (name, role, bio, photo, show_photo, sort_order, published) values (
    ${name}, ${role}, ${"Sample biography — replace with the leader's real story in the admin under Leadership."},
    ${sql.json(image(`Portrait of the ${role}`, 800, 1000))}, true, ${index + 1}, true)
    returning id`.then((rows) => record.rows.leaders.push(rows[0].id));
}

/* ------------------------------------------------------------- Events */

const testimonies = (count) =>
  [
    { name: "Sister A. (sample)", body: "Sample testimony — I came to the convention burdened, and I left with peace and joy. God answered a prayer I had prayed for years." },
    { name: "Brother B. (sample)", body: "Sample testimony — after the prayer session on the second night, I received the job offer I had been waiting for." },
    { name: "Mrs C. (sample)", body: "Sample testimony — my family was restored. Thank you, Jesus!" },
  ]
    .slice(0, count)
    .map((t) => ({ id: id(), kind: "written", location: "Lagos", published: true, ...t }));

async function event(values) {
  const v = {
    summary: null, description: null, category: null, series: null, end_date: null, all_day: false, start_time: null, end_time: null, location: "Main Auditorium",
    address: "1 Sample Street (replace)\nLagos, Nigeria", online_url: null, format: "in-person", flyer: null, registration_required: false,
    registration_url: null, registration_deadline: null, registration_note: null, schedule: [], recap_body: null, recap_videos: [],
    testimonies: [], featured: false, contact_name: null, contact_email: null, ...values,
  };
  const [row] = await sql`insert into events (slug, title, summary, description, category, series, date, end_date, all_day, start_time, end_time,
      timezone, format, location, address, online_url, flyer, registration_required, registration_url, registration_deadline, registration_note,
      contact_name, contact_email, schedule, recap_body, recap_videos, testimonies, featured, published)
    values (${v.slug}, ${v.title}, ${v.summary}, ${v.description}, ${v.category}, ${v.series}, ${v.date}, ${v.end_date}, ${v.all_day},
      ${v.start_time}, ${v.end_time}, 'Africa/Lagos', ${v.format}, ${v.format === "online" ? null : v.location}, ${v.format === "online" ? null : v.address},
      ${v.online_url}, ${v.flyer ? sql.json(v.flyer) : null}, ${v.registration_required}, ${v.registration_url}, ${v.registration_deadline},
      ${v.registration_note}, ${v.contact_name}, ${v.contact_email}, ${sql.json(v.schedule)}, ${v.recap_body}, ${sql.json(v.recap_videos)},
      ${sql.json(v.testimonies)}, ${v.featured}, true)
    returning id`;
  record.rows.events.push(row.id);
  return row.id;
}

const year = new Date().getUTCFullYear();
const convention = await event({
  slug: `holy-ghost-convention-${year}`,
  title: "Holy Ghost Convention",
  summary: "Sample event — three nights of worship, the Word and prayer.",
  description: "This is a **sample past event** showing how a recap looks. Replace or delete it in the admin.\n\nThree nights of worship, powerful messages and prayer.",
  category: "Conference",
  series: "Holy Ghost Convention",
  date: day(-80),
  end_date: day(-78),
  start_time: "18:00",
  end_time: "21:00",
  format: "hybrid",
  online_url: "https://www.youtube.com/@pastorola1790",
  flyer: image("Holy Ghost Convention flyer", 900, 1125),
  schedule: [
    { time: "Day 1", title: "Opening night — worship & the Word" },
    { time: "Day 2", title: "Night of prayer" },
    { time: "Day 3", title: "Thanksgiving & closing service", note: "Sample note" },
  ],
  recap_body:
    "## Day one\nSample recap — we opened with a powerful time of **worship**, followed by the message *Walking in Victory*.\n\n> Now thanks be unto God, which always causeth us to triumph in Christ.\n\n## Highlights\n- Three nights of prayer and worship\n- Many gave their lives to Christ\n- Testimonies of healing and restoration",
  recap_videos: [
    { id: id(), title: "Day 1 — Opening message (sample)", url: video(0), kind: "sermon", speaker: "Pastor (sample name)" },
    { id: id(), title: "Night of prayer — highlights (sample)", url: video(1), kind: "highlight" },
    { id: id(), title: "Closing worship (sample)", url: video(2), kind: "worship" },
  ],
  testimonies: testimonies(3),
  featured: false,
});
await event({
  slug: `holy-ghost-convention-${year - 1}`,
  title: "Holy Ghost Convention",
  summary: "Sample event — last year's convention.",
  description: "A **sample** earlier edition, so you can see the yearly event linking between years.",
  category: "Conference",
  series: "Holy Ghost Convention",
  date: day(-445),
  end_date: day(-443),
  start_time: "18:00",
  end_time: "21:00",
  recap_body: "Sample recap of last year's convention — what God did, the messages and highlights.",
  recap_videos: [{ id: id(), title: "Opening message (sample)", url: video(3), kind: "sermon" }],
  testimonies: testimonies(1),
});
await event({
  slug: `youth-day-${year}`,
  title: "Youth Day Celebration",
  summary: "Sample event — a day of worship, games and fellowship for young people.",
  description: "Sample past event without a recap yet.",
  category: "Youth",
  date: day(-30),
  all_day: true,
});
await event({
  slug: `thanksgiving-service-${year}`,
  title: "Family Thanksgiving Service",
  summary: "Sample upcoming event — a special service of thanksgiving.",
  description: "Sample — come with your family as we give thanks for all God has done this year.",
  category: "Worship",
  date: day(20),
  start_time: "09:00",
  end_time: "12:00",
  format: "hybrid",
  online_url: "https://www.youtube.com/@pastorola1790",
  flyer: image("Thanksgiving service flyer", 900, 1125),
  featured: true,
});
await event({
  slug: `marriage-seminar-${year}`,
  title: "Marriage & Family Seminar",
  summary: "Sample upcoming event with registration.",
  description: "Sample — practical teaching for couples and families. Registration opens a sample form (example.org).",
  category: "Seminar",
  date: day(34),
  start_time: "10:00",
  end_time: "14:00",
  registration_required: true,
  registration_url: "https://forms.example.org/sample-registration",
  registration_deadline: day(31),
  registration_note: "Sample — please register each person attending.",
  contact_name: "Events team (sample)",
  contact_email: "events@example.org",
});
await event({
  slug: `crossover-night-${year}`,
  title: "Crossover Night",
  summary: "Sample upcoming event — cross into the new year in God's presence.",
  description: "Sample — worship, prayer and thanksgiving into the new year.",
  category: "Worship",
  date: `${year}-12-31`,
  end_date: `${year + 1}-01-01`,
  start_time: "21:00",
  end_time: "01:00",
});
await event({
  slug: `youth-retreat-${year + 1}`,
  title: "Youth Retreat",
  summary: "Sample event — date to be announced.",
  category: "Youth",
  date: null,
});

/* ------------------------------------------------------------ Sermons */

const sermons = [
  ["Walking in Victory", "Romans 8:37", ["Faith", "Victory"], -6, convention],
  ["The Power of Prayer", "James 5:16", ["Prayer"], -13, null],
  ["Grace for Every Season", "2 Corinthians 12:9", ["Grace", "Faith"], -20, null],
  ["Called to Shine", "Matthew 5:14–16", ["Purpose", "Evangelism"], -27, null],
  ["A Family of Faith", "Ephesians 2:19", ["Family", "Church"], -34, null],
  ["Peace that Passes Understanding", "Philippians 4:6–7", ["Peace", "Prayer"], -41, null],
];
for (const [index, [title, scripture, topics, offset, eventId]] of sermons.entries()) {
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-sample`;
  await sql`insert into sermons (slug, title, speaker, date, series, scripture, other_scriptures, topics, description, youtube_url, event_id, featured, published)
    values (${slug}, ${`${title} (sample)`}, ${"Pastor (sample name)"}, ${day(offset)}, ${index < 3 ? "Victorious Living (sample series)" : null},
      ${scripture}, ${sql.json(["Psalm 23:1", "John 14:27"].slice(0, (index % 2) + 1))}, ${sql.json(topics)},
      ${`Sample summary — replace with what the message “${title}” is about: the main points and scriptures.`},
      ${video(index)}, ${eventId}, ${index === 0}, true)
    returning id`.then((rows) => record.rows.sermons.push(rows[0].id));
}

/* ------------------------------------------------------------ Gallery */

async function album(title, slug, date, category, count, eventId = null, featured = false) {
  const [row] = await sql`insert into gallery_albums (title, slug, date, category, description, event_id, featured, published)
    values (${title}, ${slug}, ${date}, ${category}, ${"Sample album — generated images. Replace with real photos in the admin."}, ${eventId}, ${featured}, true)
    returning id`;
  record.rows.gallery_albums.push(row.id);
  for (let i = 0; i < count; i++) {
    const portrait = i % 3 === 1;
    await sql`insert into gallery_photos (album_id, image, sort_order)
      values (${row.id}, ${sql.json(image(`${title} photo ${i + 1}`, portrait ? 900 : 1200, portrait ? 1200 : 800))}, ${i})`;
  }
}
await album(`Holy Ghost Convention ${year}`, `holy-ghost-convention-${year}-photos`, day(-80), "Conference", 8, convention, true);
await album("Sunday Worship", "sunday-worship-sample", day(-6), "Worship", 6);
await album("Youth Day Celebration", "youth-day-sample", day(-30), "Youth", 5);

await sql`insert into settings (key, data) values (${MARKER}, ${sql.json(record)})`;
  });
} catch (error) {
  for (const created of createdFiles) rmSync(created, { force: true });
  console.error("\nNothing was added — the sample content couldn't be saved:", error instanceof Error ? error.message : error);
  await db.end();
  process.exit(1);
}
sql = db;

console.log(`
Sample content added (only into empty spaces — nothing you entered was changed):
  • Empty fields on Church information, Home, About, Watch, Events page and Giving
  • 3 service times, 4 leaders, 6 sermons${videos.length ? " (videos from the church's YouTube channel)" : ""}
  • 7 events — 3 past (with recaps, videos, testimonies and photos), 3 upcoming, 1 date to be announced
  • 3 photo albums (${imageCount} generated sample images in total)

Restart \`npm run dev\` to see it on the website.
Remove it all later with:  npm run seed:sample -- --clear
`);
await db.end();
