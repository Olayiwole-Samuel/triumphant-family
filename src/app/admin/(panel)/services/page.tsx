import { asc, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { ButtonLink, EmptyNote, ItemList, ItemRow, PageHeader, StatusPill } from "@/components/admin/ui";
import { getDb, schema } from "@/lib/db";
import { formatTime } from "@/lib/utils/format";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Service times" };

const capitalise = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);

export default async function ServicesPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  const t = schema.serviceTimes;
  const services = await getDb()
    .select()
    .from(t)
    .orderBy(sql`${t.sortOrder} asc nulls last`, asc(t.startTime));
  return (
    <>
      <PageHeader
        title="Service times"
        description="Shown on the Home, Contact and Watch pages and in the footer."
        actions={<ButtonLink href="/admin/services/new" icon="plus">Add service time</ButtonLink>}
      />
      {services.length ? (
        <ItemList>
          {services.map((service) => (
            <ItemRow
              key={service.id}
              href={`/admin/services/${service.id}`}
              title={service.title}
              meta={[capitalise(service.day), formatTime(service.startTime), service.location].filter(Boolean).join(" · ")}
              status={<StatusPill published={service.published} draftLabel="Hidden" liveLabel="Shown" />}
            />
          ))}
        </ItemList>
      ) : (
        <EmptyNote icon="clock" title="No service times yet" action={<ButtonLink href="/admin/services/new" icon="plus">Add service time</ButtonLink>}>
          Add your regular services so visitors know when to join.
        </EmptyNote>
      )}
    </>
  );
}
