# The Triumphant Family — Website

The website of **The Triumphant Family** (The Gleam of Salvation Apostolic Ministry): a premium, animation-rich church site built for online members first, while welcoming local members and first-time visitors.

**Status:** Home, About, Contact (working email form), Give (bank transfer), Watch (YouTube + verified live status), Sermons (searchable archive, detail pages, audio), Gallery (albums + lightbox) and Events (upcoming/past archive, event pages with registration links, Add to Calendar, sharing, and **recaps** — videos, photos and testimonies to look back on). Everything is managed in **our own admin at `/admin`**, backed by our own Postgres database.

> Maintained by a single developer. Every dependency has a clear purpose; prefer the existing patterns over new abstractions.

---

## 1. Tech stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, Cache Components, Turbopack) | Static-first pages that refresh instantly when the admin saves |
| Language | **TypeScript** (strict) | Content types in `src/types/content.ts` |
| Styling | **Tailwind CSS v4** | Tokens live in `src/app/globals.css` (`@theme`) |
| Animation | **GSAP** + ScrollTrigger + SplitText, **@gsap/react** (`useGSAP`) | Showcase-level motion with automatic cleanup |
| Smooth scroll | **Lenis** | One global instance, synced to ScrollTrigger |
| Database | **Postgres** via **Drizzle ORM** (`postgres` driver) | All content. Live: **Neon**. Locally: **PGlite** (nothing to install) |
| Admin | Our own, at `/admin` (`src/app/admin`) | One login, plain-English screens, built into the site |
| Images & audio | **Cloudinary** (live) · `.data/uploads` (local) | Uploads, automatic resizing / WebP / AVIF |
| Email | **Resend** | Delivers contact-form messages |
| Video | **YouTube** (Data API v3 or public RSS) | Sermon videos, event videos, recent uploads, verified live status |
| Hosting | **Vercel** | |

Not used on purpose (yet): a third-party CMS, Paystack/card payments, member accounts, UI component libraries.

---

## 2. Getting started

**Requirements:** Node.js **22.12+** and npm. That's all for local work.

```bash
npm install
cp .env.example .env.local   # optional locally — every value can stay empty
npm run dev                  # http://localhost:3000
```

`npm run dev` first starts a **local database** (stored in `.data/pglite`, created on first run) and applies any pending database changes, then starts the site. Open **http://localhost:3000/admin** — the first visit asks you to **create the admin account** (your email + a password).

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local database + development server |
| `npm run build` / `npm start` | Migrate the database, then build / serve the production site |
| `npm run db:migrate` | Apply database changes only |
| `npm run db:generate` | After editing `src/lib/db/schema.ts`: create a migration in `./drizzle` |
| `npm run admin:reset-password` | Forgotten password: sets a temporary one and prints it (section 4) |
| `npm run seed:sample` | Local only: fill every **empty** field with clearly marked sample content (sermons, events with recaps, albums, leaders, service times, page texts). Never changes what you entered |
| `npm run seed:sample -- --clear` | Remove exactly the sample content again (your own content and login are kept; sample text you edited is kept) |
| `npm run lint` / `typecheck` / `check` | ESLint · route types + `tsc` · both |

`.data/` (local database + local uploads) is git-ignored. Delete it to start again with an empty site.

---

## 3. Environment variables

All documented in [`.env.example`](.env.example). `NEXT_PUBLIC_*` values are visible in the browser — never put secrets in them. Never commit `.env.local`.

| Variable | Needed | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | live site | Canonical URLs, sitemap, sharing links |
| `DATABASE_URL` | live site | Server-only. Neon connection string. **Leave empty locally** (local database is automatic) |
| `ADMIN_SETUP_CODE` | live site, once | Server-only. Asked for when creating the admin account on the live site |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | live site | Server-only. Uploads from the admin. Locally, uploads go to `.data/uploads` instead |
| `RESEND_API_KEY` / `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` | contact form | Server-only. See section 6 |
| `YOUTUBE_API_KEY` | recommended | Server-only. Recent uploads with durations + verified live status (section 8) |

Restart `npm run dev` after changing `.env.local`. On Vercel: Project → Settings → Environment Variables, then redeploy.

---

## 4. The admin (`/admin`)

### Signing in

- **First time:** `/admin` → *Create your admin account*. This is the only account; the page disappears once it exists.
  - On the live site the setup page also asks for `ADMIN_SETUP_CODE` (so nobody else can claim the admin first).
- **Sign in:** `/admin/login`. After 8 wrong attempts from one network, sign-in pauses for 15 minutes.
- **Change password or email:** Admin → *Account & password* (other devices are signed out).
- **Forgot the password:** stop the dev server, run `npm run admin:reset-password` — it prints a temporary password. For the live site, run it with `DATABASE_URL` set to the live database. Add `-- --email new@address` to change the email too.

Security notes: passwords are stored only as **scrypt hashes**; the session cookie is http-only and its token is stored only as a hash; every admin action re-checks the session on the server; all form input is validated on the server; uploads are checked by file content, not name.

### What's where

| Admin section | Controls | Shown on |
| --- | --- | --- |
| Dashboard | Quick actions, setup checklist, what's coming up | — |
| Sermons | Title, date, speaker, series, summary, YouTube link, MP3 (upload or link), thumbnail, scriptures, topics, event it was preached at, *Feature this*, draft/published | Home, Watch, Sermons, sermon pages, event recaps |
| Events | Details, dates/times/time zone, venue & online link, registration link, programme, contact, **recap**, **videos**, **testimonies**, **photos**, yearly-event name, draft/published | Home, Events, event pages, Gallery |
| Photo gallery | Albums (name, date, category, linked event, featured, order) and their photos | Gallery, Home photo story, event pages |
| Service times | Day, start/end (Lagos time), location, order, show/hide | Home, Contact, Watch, footer |
| Leadership | Name, role, bio, photo, **Show photo**, order, show/hide | Home (first three), About |
| Church information | Name, logo, sharing image, contact details, address, map, YouTube channel, social links, mission, vision, beliefs | Everywhere |
| Home / About / Watch / Events page | Each page's headings, text, photos, buttons, featured picks | That page |
| Giving | Bank details, instructions, scripture, ways to give, show/hide | Give, Home |

### Everyday use

- **Draft or published:** sermons, events and albums have *Save as draft* / *Publish*. Only published items appear on the website. Service times and leaders have a *Show on website* switch.
- **Saving:** the bar at the bottom shows "You have unsaved changes"; leaving the page warns you. Problems are explained under the field and the page jumps to the first one — nothing you typed is lost.
- **Changes appear immediately** on the website after saving (no waiting, no webhooks).
- **Formatted text** (About story, event descriptions and recaps): blank line between paragraphs; the toolbar adds **bold**, *italic*, links, headings, quotes and bullet lists.
- **Photos:** tap to upload or drag a file in. Large phone photos are shrunk to 2400px before uploading. Describe each photo (for screen readers). Tap a photo to set its focal point where offered (it stays in view when cropped). iPhone HEIC photos must be exported as JPG first.
- **Deleting** asks for a second tap. Deleting an event keeps its photos in the gallery.

### Events and recaps (looking back)

Every event has its own page at `/events/<web-address>`. After the event, open it in the admin and fill in:

- **Recap & videos → What happened:** a written recap — the messages' main points, scriptures, highlights.
- **Videos from the event:** YouTube links (sermons, highlights, worship), each with a title, type and speaker.
- **Testimonies:** written, or a YouTube link for video testimonies. Each has a *Show on website* switch — check with the person first.
- **Photos from the event:** upload many at once; they are saved as they upload. They're kept in a gallery album linked to the event, so they also appear in the Photo gallery.
- **Sermons:** when adding a sermon, choose *Preached at an event?* — it then appears on that event's page too.

On the public page, past events show **Look back: recap, videos & photos**, with tabs for *Recap · Messages & videos · Photos · Testimonies*.

**Yearly events:** give each year's event the same **Yearly event name** (e.g. "Holy Ghost Convention"). Each year's page then lists the others under "… through the years", so five years from now every edition is one tap away. Each year gets its own web address (the year is added automatically, e.g. `/events/holy-ghost-convention-2026`).

### Event rules (checked when saving)

The end date can't be before the start date; the end time must be after the start time on single-day events; in-person/hybrid events need a venue; online/hybrid events need an online link; *Registration required* needs a registration link; the registration deadline must be on or before the last day; videos and video testimonies need valid YouTube links.

**Upcoming vs past** is automatic, in each event's own time zone (default Africa/Lagos): an event stays upcoming until its end time — or the end of its last day without an end time — then moves to *Past events*. Undated events show "Date to be announced" and are listed last.

**Featured:** *Feature this* on an event shows the soonest featured upcoming event large at the top of `/events`. Home page → *Featured event* puts it first on the Home page.

**Add to Calendar** appears only for upcoming events with a date **and** an end time (or all-day) — the site never guesses a duration. *Google Calendar* opens a pre-filled event; *Apple, Outlook & others* downloads an RFC 5545 `.ics` file. A timed multi-day event is exported as one block from the first day's start to the last day's end. **Share** uses the phone's share sheet, else copies the link.

**Registration** always opens your external form (Google Forms, Eventbrite…); the website never takes registrations itself, and the button disappears after the deadline.

### Content rules (`src/lib/content/index.ts`)

- The database is the only source of truth. A page that hasn't been filled in yet uses neutral defaults (no invented facts); an empty list shows a designed empty state; a failed database request is logged (`[content] Could not load …`) and the page still renders.
- **Featured sermon:** Home page pick → newest marked *Feature this* → newest.
- **Gallery photo story (Home):** Home page photos → else photos from the featured/newest albums.
- **Leader photos:** with *Show photo* off, the photo is never sent to the website.
- **Giving:** until an account number is saved, the Give page says details are being prepared and the copy button is disabled.

### For developers: data & admin code

```
src/lib/db/schema.ts        tables (settings JSON per page; sermons, events, albums, photos, service times, leaders, admin)
src/lib/db/index.ts         connection (postgres.js + Drizzle)
src/lib/content/            public data access (cached, tagged) + page settings
src/lib/admin/              sessions, password hashing, form validation, slugs, uploads
src/app/admin/              login/setup + (panel)/… screens and their server actions
src/components/admin/       form kit: AdminForm, fields, ListField, image/audio uploaders, PhotoManager
scripts/with-db.mjs         local database + migrations before dev/build/start
drizzle/                    SQL migrations (commit them)
```

**Adding a field:** add the column in `schema.ts` → `npm run db:generate` → map it in `src/lib/content/index.ts` (public) → add the input to the admin form and read it in that screen's `actions.ts` with `FormReader` → call `refreshPublic(<tag>)` (already done in each action).

**Local database note:** the local server (PGlite) is reliable with one connection per process, so the app uses a single connection locally and local builds use one worker. Don't run `npm run build` while `npm run dev` is running. Neither applies to Neon.

---

## 5. Live site setup (Neon + Cloudinary + Vercel)

1. **Database — Neon** ([neon.tech](https://neon.tech), free plan): create a project (region close to your visitors, e.g. Frankfurt) → *Connection string* → copy the **pooled** connection → `DATABASE_URL`.
2. **Images — Cloudinary** ([cloudinary.com](https://cloudinary.com), free plan): Dashboard → copy *Cloud name*, *API key*, *API secret* → `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. **Vercel:** import the repository → add the variables above plus `NEXT_PUBLIC_SITE_URL` and a long random `ADMIN_SETUP_CODE` → deploy. The build applies the database migrations automatically.
4. Open `https://your-domain/admin` → create the admin account (enter the setup code) → fill in Church information, service times, etc.
5. Send a test message through `/contact`.

Content created locally stays in your local database — it isn't copied to the live site automatically (enter real content on the live admin).

**Backups:** Neon keeps point-in-time history (restore window depends on the plan). Cloudinary keeps the uploaded files.

---

## 6. Contact form (Resend)

`/contact` posts to `POST /api/contact`, which validates everything on the server and sends the message to `CONTACT_TO_EMAIL` via Resend with the visitor’s address as Reply-To.

**Setup**
1. Create a Resend account → **Domains** → add and verify your church domain (DNS records).
2. **API Keys** → create a key with *Sending access* → `RESEND_API_KEY`.
3. Set `CONTACT_TO_EMAIL` (the inbox) and `CONTACT_FROM_EMAIL` (an address on the verified domain).
   Quick test before verifying a domain: `CONTACT_FROM_EMAIL=onboarding@resend.dev` works but only delivers to your own Resend account email.
4. Restart the server.

**Protection:** server-side validation and length limits, JSON-only bodies under 20 KB, a hidden honeypot field, and a minimum fill time. Message contents are never logged. Success is shown **only** when Resend accepts the email.

**Responses:** `200` sent · `400` malformed / too fast · `413` too large · `415` not JSON · `422` invalid fields · `502` Resend rejected or unreachable · `503` not configured.

**Testing**
- In the browser: submit the empty form (field errors appear and focus moves to the first one), then a valid message. Without credentials you’ll see “isn’t set up to send messages yet” — that’s expected.
- From the command line (wait a few seconds after loading the page in real use; here `startedAt` is set 10 s in the past):
  ```bash
  curl -X POST http://localhost:3000/api/contact -H "Content-Type: application/json" -d "{\"name\":\"Test Person\",\"email\":\"you@example.com\",\"subject\":\"Test\",\"message\":\"Testing the contact form.\",\"website\":\"\",\"startedAt\":$(( $(date +%s) * 1000 - 10000 ))}"
  ```
  With credentials configured you should get `{"ok":true}` and an email in `CONTACT_TO_EMAIL`.

---

## 7. Images & audio

- The admin asks the server where to upload (`POST /api/admin/upload`, signed-in only). With Cloudinary configured, the browser uploads **directly to Cloudinary** using a short-lived signature — large MP3s never pass through the website's server and the API secret never leaves it. Without Cloudinary and on the local database, files are saved in `.data/uploads` and served from `/uploads/…`.
- Images are stored as `{ url, alt, width, height, focalPoint? }`. `MediaImage` resizes Cloudinary images through Cloudinary's CDN (`f_auto,q_auto,w_…` in the URL); other images use the Next.js optimiser.
- Limits: images up to 15 MB (shrunk in the browser first), audio up to 100 MB (MP3/M4A).
- Removing a photo from the admin removes it from the website; the file itself stays in Cloudinary (clean up there if storage matters).

---

## 8. YouTube, live streaming & media

### How YouTube is used

All YouTube access lives in `src/lib/youtube/` (`api.ts` is the only file that calls YouTube). The channel is set in **Church information → YouTube channel link / channel ID** (verified ID for @pastorola1790: `UCWehoRiDVFyMsqC9Gf9iAdQ`, used until another is saved).

| | With `YOUTUBE_API_KEY` | Without a key |
| --- | --- | --- |
| Recent uploads | Data API: uploads playlist (25 newest) + video details (duration, embeddable, broadcast data) | Public RSS feed (15 newest, no durations) |
| Live status | Verified from YouTube broadcast metadata | Not shown (“not configured”) |
| If YouTube fails | Falls back to RSS for uploads; live status “unavailable” | Recent videos show an empty state |

Sermons added in the admin never depend on YouTube's API — they keep working either way.

### Getting and restricting an API key

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project → **APIs & Services → Library** → enable **YouTube Data API v3**.
2. **Credentials → Create credentials → API key**.
3. Edit the key → **API restrictions → Restrict key → YouTube Data API v3**. (Leave *Application restrictions* as **None** — the key is only used server-side on Vercel, whose IP addresses change. Never put it in a `NEXT_PUBLIC_` variable.)
4. Set `YOUTUBE_API_KEY` in `.env.local` / Vercel and redeploy.

### Caching & quota

- One shared server cache: YouTube is checked at most **every ~2 minutes**, whatever the traffic (`cacheLife` in `api.ts`). Each check costs about **2 quota units** (the uploads-playlist lookup is cached for a day) — roughly 1,500 units/day against the default 10,000.
- The Watch page refreshes live status in the browser every **90 seconds**, only while the tab is visible, via `GET /api/live-status` (takes no parameters; CDN-cached 60 s) — one poller per page.
- **Quota exceeded / key invalid / network error:** recent uploads fall back to the RSS feed, live status shows “We couldn’t check for a live service just now”, and the failure is cached for ~2 minutes so YouTube isn’t hammered. Nothing is invented.

### How live status is decided

Only YouTube’s own broadcast metadata counts (`classifyLiveStatus` in `src/lib/youtube/parse.ts`):

- **Live now** — `liveBroadcastContent = "live"` with an actual start time and no end time.
- **Upcoming** — `"upcoming"` with a scheduled start time (shown in Lagos time; schedules missed by more than 2 hours are ignored). Never labelled live.
- **Streamed recently** — a broadcast that ended in the last 12 hours.
- **None** — none of the above. Titles containing “live” never count.

**Manual fallback:** Admin → Watch page → *Manual livestream link*. Shown only when automatic checking isn’t available, and always labelled “Shared by the church team — we can’t confirm it’s live”. Clear it after the service.

### Sermons

Admin → **Sermons → Add sermon**: title, date preached, speaker; then the YouTube link and/or an MP3 (upload or paste an https link) — at least one is required; scriptures and topics (reuse the same topic words — they power the filters and “Related messages”); optional thumbnail (else the YouTube thumbnail), series, event, *Feature this*. **Publish.** The page appears at `/sermons/<web-address>`.

**Admin vs YouTube:** sermons in the admin are the source of truth. Recent YouTube uploads not yet added in the admin also appear, with pages at `/sermons/yt-<videoId>` built only from YouTube's own title, date and description. Matching is by video ID: once a sermon in the admin uses the same video, the YouTube copy is dropped and `/sermons/yt-<id>` shows the admin's sermon.

**Archive:** `/sermons` searches (title, speaker, series, scriptures, topics), filters (speaker, topic, year, media) and paginates on the server; the state lives in the URL.

### Gallery

Admin → **Photo gallery → New album** → name and save → upload many photos at once, describe them, reorder, choose the cover. *Feature this* puts the album first; *Display order* controls the rest (then newest). Albums without photos stay hidden. Photos open in an accessible lightbox (Esc closes, ← → or swipe to move).

---

## 9. Design system — “Deep Royal × iOS”

Defined in `src/app/globals.css`.

- **Colour:** the logo colours plus a **tonal plum scale** (`plum-50` … `plum-950`, where `plum-600` is the logo purple). Dark surfaces are `plum-950/900` with white + `plum-200/300` text; light surfaces are `plum-50`/white with `plum-950` text and `plum-600` accents. **Gold** is a tiny accent only — never a fill next to pink, never on light backgrounds, never at low opacity. A muted `danger` red exists for admin errors only.
- **Type:** **Mona Sans** (headlines slightly expanded at 112% width, body at normal width) + **Cormorant italic** for scripture, the marquee and emphasis (`scripture` utility). Change fonts in `src/app/layout.tsx` + the `@theme inline` block.
- **Signature mark:** the four-point **gleam** (`src/components/ui/Gleam.tsx`).
- **iOS materials & shapes:** `material-dark` / `material-light`, `rounded-card`, `rounded-media`, `squircle`, `shadow-card` / `shadow-float`, and `sheet` (a light section sliding over the dark one above).
- **Accessibility:** focus rings on every surface, skip link, semantic landmarks, labelled form fields with linked error messages, alt text on uploads, reduced-motion support.

## 10. Animation system

```
src/lib/animations/
  gsap.ts        ← the ONLY place plugins are registered (import gsap from here)
  constants.ts   ← eases, durations, staggers, scrub values, media queries
  useMotion.ts   ← useGSAP + gsap.matchMedia wrapper used by every component
  lenis.ts       ← access to the single Lenis instance (lockScroll, scrollToTarget)
src/components/animations/
  SmoothScroll   ← creates Lenis once, drives it from GSAP's ticker
  Reveal, Stagger (rise | tilt), SplitText (3D lines | words-scrub), ImageReveal,
  Parallax, HorizontalScroll (+ inner parallax), Magnetic, Marquee, Aurora
```

- Write animations with `useMotion((media, root) => { … }, { scope: ref })`: scoped selectors, full cleanup on unmount, `media.isDesktop / isMobile / finePointer`, and **no animation at all for reduced-motion users** (content is simply shown).
- `data-animate` elements start hidden only when JS + motion are available; an inline script un-hides everything after 3 s if the animation system fails to start.
- The admin uses no scroll animation — it's built for clarity.

## 11. Project structure

```
src/
  app/
    (site)/                public pages + layout (header, footer, smooth scroll, SEO)
    (site)/sermons/[slug]  sermon pages (admin slug or yt-<videoId>)
    (site)/events/[slug]   event pages (details + recap)
    admin/                 login, setup, (panel)/ screens + server actions
    api/admin/upload       upload signing / local uploads (admin only)
    api/contact            contact form → Resend
    api/live-status        verified live status (polled by the Watch page)
    uploads/[...path]      serves local uploads during development
    sitemap.ts robots.ts not-found.tsx global-error.tsx icon.svg
  components/
    admin/                 admin form kit and layout
    sections/…             public page sections (events: EventDetail, EventRecap, EventPhotoGrid…)
    media/                 MediaImage, YouTubePlayer (lazy, privacy-enhanced), AudioPlayer
    animations/ layout/ navigation/ footer/ ui/
  content/church.ts        the few fixed facts (church name, ministry, YouTube channel)
  lib/  db/ content/ admin/ cloudinary/ media/ contact/ sermons/ events/ youtube/ animations/ utils/ seo.ts site.ts
  types/content.ts
drizzle/                   database migrations
scripts/with-db.mjs  scripts/admin-reset-password.mjs
```

## 12. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `npm run dev` fails with a database error | Another program uses port 54329, or `.data/pglite` is damaged. Close other dev servers; as a last resort delete `.data/` (this erases local content). |
| Pages empty / "coming soon" | Nothing **published** yet (drafts don't appear). Check the server log for `[content] Could not load …`. |
| `/admin` always goes to the sign-in page | The session expired or cookies are blocked for the site. |
| "Too many sign-in attempts" | Wait 15 minutes. Forgot the password? `npm run admin:reset-password`. |
| Live site setup page says it's locked | Set `ADMIN_SETUP_CODE` in Vercel and redeploy. |
| Upload says uploads "aren't set up yet" | Live site: add the three Cloudinary variables and redeploy. |
| HEIC photo can't be uploaded | Export it as JPG first (or iPhone Settings → Camera → Formats → Most Compatible). |
| Contact form says it “isn’t set up yet” | One of `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` is missing (server log: `[contact] Email is not configured`). |
| Contact form says it “couldn’t be sent” | Resend rejected it — server log shows `[contact] Resend rejected the message: <reason>`. Usually an invalid key or an unverified `CONTACT_FROM_EMAIL` domain. |
| Leader photo not showing | Check **Show photo** is on and the leader is shown on the website. |
| Copy account number button disabled | No account number saved in Admin → Giving. |
| Watch page never shows “Live now” | Expected without `YOUTUBE_API_KEY`, or if Watch page → *Check YouTube for live services* is off. With a key, check the server log for `[youtube] Data API unavailable (<reason>)`. |
| Recent videos say “unavailable” | YouTube could not be reached. Without an API key the site relies on YouTube’s RSS feed, which YouTube occasionally takes offline. An API key avoids this. |
| Video shows “can’t be played on our website” | The owner disabled embedding on YouTube (YouTube Studio → video → *Allow embedding*). The *Watch on YouTube* link always works. |
| Sermon audio says it “couldn’t be loaded” | The MP3 link is wrong or not public over https; upload the file instead. |
| Gallery album missing | Albums with no photos are hidden; check it has photos and is published (“In gallery”). |
| Event missing from Upcoming | It has finished (look under *Past*) or it's still a draft. |
| Event time looks an hour off | Check the event's *Time zone* — times are local time at the event. |
| No “Add to calendar” / “Register” button | The event needs a date and an end time (or *All-day*) / registration link, and must not have finished. |
| Other years not linked | Both events need exactly the same *Yearly event name* (capital letters don't matter). |
| Shared links point to the wrong site | Set `NEXT_PUBLIC_SITE_URL` to the live address and redeploy. |

## 13. Phase status

- **Phase 1–3:** foundation, design system, animation system, SEO; Home, About, Contact, Give; Watch (verified live status), sermon archive and pages, gallery.
- **Phase 4:** events archive and event pages (time zones, registration links, Add to Calendar, sharing, schema.org data).
- **Phase 5 (this):** Sanity replaced by **our own admin and Postgres database** (Drizzle; PGlite locally, Neon live; Cloudinary uploads); one secure admin login; **event recaps** — written recap, videos, photos, testimonies, sermons preached, and yearly events linked across the years.
- **Next:** online giving (Paystack).
