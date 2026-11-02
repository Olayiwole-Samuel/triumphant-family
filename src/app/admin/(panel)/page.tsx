import { asc, count, desc, eq, gte, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ButtonLink, Card, PageHeader, StatusPill } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { cloudinaryConfig } from "@/lib/cloudinary/server";
import { readSettings } from "@/lib/content/settings";
import { getDb, isLocalDatabaseUrl, schema } from "@/lib/db";
import { formatEventDates } from "@/lib/events/time";
import { formatDate } from "@/lib/utils/format";
import { churchNow } from "@/lib/utils/time";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Dashboard" };

async function counts() {
  const db = getDb();
  const tally = async (table: typeof schema.sermons | typeof schema.events | typeof schema.galleryAlbums) => {
    const rows = await db
      .select({ published: table.published, total: count() })
      .from(table)
      .groupBy(table.published);
    return {
      published: rows.find((row) => row.published)?.total ?? 0,
      drafts: rows.find((row) => !row.published)?.total ?? 0,
    };
  };
  const [sermons, events, albums, [photos], [services], [leaders]] = await Promise.all([
    tally(schema.sermons),
    tally(schema.events),
    tally(schema.galleryAlbums),
    db.select({ total: count() }).from(schema.galleryPhotos),
    db.select({ total: count() }).from(schema.serviceTimes).where(eq(schema.serviceTimes.published, true)),
    db.select({ total: count() }).from(schema.leaders).where(eq(schema.leaders.published, true)),
  ]);
  return { sermons, events, albums, photos: photos.total, services: services.total, leaders: leaders.total };
}

export default async function DashboardPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  await connection(); // always current: uses today's date
  const db = getDb();
  const today = churchNow().date;
  const [totals, site, giving, upcoming, recentSermons] = await Promise.all([
    counts(),
    readSettings("site"),
    readSettings("giving"),
    db
      .select({ id: schema.events.id, title: schema.events.title, date: schema.events.date, endDate: schema.events.endDate, published: schema.events.published })
      .from(schema.events)
      .where(gte(sql`coalesce(${schema.events.endDate}, ${schema.events.date})`, today))
      .orderBy(asc(schema.events.date))
      .limit(4),
    db
      .select({ id: schema.sermons.id, title: schema.sermons.title, date: schema.sermons.date, speaker: schema.sermons.speaker, published: schema.sermons.published })
      .from(schema.sermons)
      .orderBy(desc(schema.sermons.updatedAt))
      .limit(4),
  ]);

  const checklist = [
    { done: Boolean(site.address && (site.phone || site.contactEmail)), label: "Add the church address and contact details", href: "/admin/church" },
    { done: Boolean(site.logo), label: "Upload the church logo", href: "/admin/church" },
    { done: totals.services > 0, label: "Add your service times", href: "/admin/services" },
    { done: totals.leaders > 0, label: "Introduce your leadership", href: "/admin/leaders" },
    { done: Boolean(giving.accountNumber), label: "Add bank details for giving", href: "/admin/pages/giving" },
    { done: totals.sermons.published > 0, label: "Publish your first sermon", href: "/admin/sermons/new" },
  ];
  const remaining = checklist.filter((item) => !item.done);
  const localDatabase = isLocalDatabaseUrl();
  const cloudinary = Boolean(cloudinaryConfig());

  return (
    <>
      <PageHeader
        title="Welcome back"
        description="Everything on the website is managed here. Changes appear on the site as soon as you save."
        actions={<ButtonLink href="/" icon="external" variant="secondary" external>View website</ButtonLink>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/sermons/new", icon: "mic" as const, title: "Add a sermon", text: "Video, audio and notes" },
          { href: "/admin/events/new", icon: "calendar" as const, title: "Add an event", text: "Programmes, conferences…" },
          { href: "/admin/gallery/new", icon: "image" as const, title: "Upload photos", text: "Create a photo album" },
        ].map((action) => (
          <Link key={action.href} href={action.href} className="group flex items-center gap-4 rounded-[1.5rem] bg-white p-5 shadow-card ring-1 ring-plum-950/5 transition-colors hover:bg-plum-100/50">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-plum-600 text-white">
              <Icon name={action.icon} size={22} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-plum-950">{action.title}</span>
              <span className="block text-sm text-plum-950/55">{action.text}</span>
            </span>
          </Link>
        ))}
      </div>

      {remaining.length > 0 && (
        <Card className="mt-6" title="Finish setting up" description={`${checklist.length - remaining.length} of ${checklist.length} done. These make the website complete for visitors.`}>
          <ul className="space-y-1">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="flex min-h-11 items-center gap-3 rounded-xl px-2 hover:bg-plum-50">
                  <span className={item.done ? "inline-flex size-6 items-center justify-center rounded-full bg-plum-600 text-white" : "inline-flex size-6 rounded-full ring-2 ring-plum-200"}>
                    {item.done && <Icon name="check" size={14} />}
                  </span>
                  <span className={item.done ? "text-plum-950/45 line-through" : "font-medium text-plum-950"}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Coming up" description="Events from today onwards.">
          {upcoming.length ? (
            <ul className="divide-y divide-plum-950/6">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <Link href={`/admin/events/${event.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2 hover:text-plum-600">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{event.title}</span>
                      <span className="block text-sm text-plum-950/55">{formatEventDates({ date: event.date ?? undefined, endDate: event.endDate ?? undefined }) ?? "Date to be announced"}</span>
                    </span>
                    <StatusPill published={event.published} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-plum-950/60">No upcoming events. <Link href="/admin/events/new" className="font-semibold text-plum-600">Add one</Link></p>
          )}
        </Card>
        <Card title="Recently edited sermons">
          {recentSermons.length ? (
            <ul className="divide-y divide-plum-950/6">
              {recentSermons.map((sermon) => (
                <li key={sermon.id}>
                  <Link href={`/admin/sermons/${sermon.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2 hover:text-plum-600">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{sermon.title}</span>
                      <span className="block text-sm text-plum-950/55">
                        {[formatDate(sermon.date), sermon.speaker].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <StatusPill published={sermon.published} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-plum-950/60">No sermons yet. <Link href="/admin/sermons/new" className="font-semibold text-plum-600">Add the first one</Link></p>
          )}
        </Card>
      </div>

      <Card className="mt-6" title="At a glance">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Sermons", value: totals.sermons.published, extra: totals.sermons.drafts },
            { label: "Events", value: totals.events.published, extra: totals.events.drafts },
            { label: "Photo albums", value: totals.albums.published, extra: totals.albums.drafts },
            { label: "Photos", value: totals.photos },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-plum-50 p-4">
              <dt className="text-sm text-plum-950/55">{stat.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-plum-950">{stat.value}</dd>
              {stat.extra ? <dd className="text-xs text-plum-950/55">+ {stat.extra} draft{stat.extra === 1 ? "" : "s"}</dd> : null}
            </div>
          ))}
        </dl>
        <p className="text-[0.8125rem] leading-relaxed text-plum-950/55">
          Content is stored in {localDatabase ? "a local database on this computer (development)" : "your online database"}; photos and audio{" "}
          {cloudinary ? "in Cloudinary" : localDatabase ? "in the project's .data folder on this computer" : "— not set up yet (add the Cloudinary settings)"}.
        </p>
      </Card>
    </>
  );
}
