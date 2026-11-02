/* eslint-disable @next/next/no-img-element -- small admin thumbnails */
import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ButtonLink, EmptyNote, ItemList, ItemRow, PageHeader, StatusPill } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { thumbUrl } from "@/lib/admin/thumb";
import { getDb, schema } from "@/lib/db";
import { eventStatus, formatEventDates } from "@/lib/events/time";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Events" };

type TimingRow = {
  date: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  timezone: string;
};

/** Adds each event's status (judged now, in its own time zone) and its date line. */
function withStatus<T extends TimingRow>(rows: T[]) {
  const now = Date.now();
  return rows.map((row) => {
    const timing = {
      date: row.date ?? undefined,
      endDate: row.endDate ?? undefined,
      startTime: row.allDay ? undefined : (row.startTime ?? undefined),
      endTime: row.allDay ? undefined : (row.endTime ?? undefined),
      allDay: row.allDay,
      timezone: row.timezone,
    };
    return { ...row, status: eventStatus(timing, now), when: formatEventDates(timing) };
  });
}

export default async function EventsAdminPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  await connection();
  const t = schema.events;
  const rows = await getDb()
    .select({
      id: t.id,
      title: t.title,
      date: t.date,
      endDate: t.endDate,
      startTime: t.startTime,
      endTime: t.endTime,
      allDay: t.allDay,
      timezone: t.timezone,
      series: t.series,
      flyer: t.flyer,
      published: t.published,
      recapBody: t.recapBody,
      recapVideos: t.recapVideos,
      testimonies: t.testimonies,
    })
    .from(t)
    .orderBy(desc(t.date))
    .limit(500);

  const events = withStatus(rows);
  const groups = [
    { title: "Upcoming", items: events.filter((e) => e.status === "upcoming").reverse() },
    { title: "Date to be announced", items: events.filter((e) => e.status === "tba") },
    { title: "Past events", items: events.filter((e) => e.status === "past") },
  ].filter((group) => group.items.length);

  return (
    <>
      <PageHeader
        title="Events"
        description="Upcoming events, and the recap of past ones — videos, photos and testimonies to look back on."
        actions={
          <>
            <ButtonLink href="/admin/pages/events" variant="secondary">Page heading</ButtonLink>
            <ButtonLink href="/admin/events/new" icon="plus">Add event</ButtonLink>
          </>
        }
      />
      {groups.length ? (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.title}>
              <h2 className="mb-3 text-sm font-semibold text-plum-950/55">{group.title}</h2>
              <ItemList>
                {group.items.map((event) => {
                  const recap = [
                    event.recapVideos.length > 0 && `${event.recapVideos.length} video${event.recapVideos.length === 1 ? "" : "s"}`,
                    event.testimonies.length > 0 && `${event.testimonies.length} testimon${event.testimonies.length === 1 ? "y" : "ies"}`,
                    event.recapBody && "recap",
                  ].filter(Boolean);
                  return (
                    <ItemRow
                      key={event.id}
                      href={`/admin/events/${event.id}`}
                      title={event.title}
                      meta={[event.when ?? "Date to be announced", event.series, ...recap].filter(Boolean).join(" · ")}
                      thumb={
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-plum-100 text-plum-500">
                          {event.flyer ? (
                            <img src={thumbUrl(event.flyer.url, 120)} alt="" className="size-full object-cover" />
                          ) : (
                            <Icon name="calendar" size={18} className="absolute inset-0 m-auto" />
                          )}
                        </span>
                      }
                      status={<StatusPill published={event.published} />}
                    />
                  );
                })}
              </ItemList>
            </section>
          ))}
        </div>
      ) : (
        <EmptyNote icon="calendar" title="No events yet" action={<ButtonLink href="/admin/events/new" icon="plus">Add event</ButtonLink>}>
          Add services, conferences and programmes. After an event, add its videos, photos and testimonies so people can look back.
        </EmptyNote>
      )}
    </>
  );
}
