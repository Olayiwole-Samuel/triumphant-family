/* eslint-disable @next/next/no-img-element -- small admin thumbnails */
import { asc, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { ButtonLink, EmptyNote, ItemList, ItemRow, PageHeader, StatusPill } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { thumbUrl } from "@/lib/admin/thumb";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Leadership" };

export default async function LeadersPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  const t = schema.leaders;
  const leaders = await getDb().select().from(t).orderBy(sql`${t.sortOrder} asc nulls last`, asc(t.name));
  return (
    <>
      <PageHeader
        title="Leadership"
        description="Shown on the About page; the first three also appear on the Home page."
        actions={<ButtonLink href="/admin/leaders/new" icon="plus">Add leader</ButtonLink>}
      />
      {leaders.length ? (
        <ItemList>
          {leaders.map((leader) => (
            <ItemRow
              key={leader.id}
              href={`/admin/leaders/${leader.id}`}
              title={leader.name}
              meta={leader.role}
              thumb={
                <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-plum-100 text-plum-500">
                  {leader.photo ? (
                    <img src={thumbUrl(leader.photo.url, 120)} alt="" className="size-full object-cover" />
                  ) : (
                    <Icon name="users" size={18} className="absolute inset-0 m-auto" />
                  )}
                </span>
              }
              status={<StatusPill published={leader.published} draftLabel="Hidden" liveLabel="Shown" />}
            />
          ))}
        </ItemList>
      ) : (
        <EmptyNote icon="users" title="No leaders yet" action={<ButtonLink href="/admin/leaders/new" icon="plus">Add leader</ButtonLink>}>
          Introduce your pastors and ministry leaders.
        </EmptyNote>
      )}
    </>
  );
}
