import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ButtonLink, Notice, PageHeader, StatusPill } from "@/components/admin/ui";
import { isUuid } from "@/lib/admin/ids";
import { getDb, schema } from "@/lib/db";
import { deleteSermon } from "../actions";
import { SermonForm } from "../SermonForm";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Edit sermon" };

export default async function EditSermonPage({ params, searchParams }: PageProps<"/admin/sermons/[id]">) {
  await requireAdmin(); // pages aren't protected by the layout's check
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const [sermon] = await getDb().select().from(schema.sermons).where(eq(schema.sermons.id, id)).limit(1);
  if (!sermon) notFound();
  return (
    <>
      <PageHeader
        title={sermon.title}
        status={<StatusPill published={sermon.published} />}
        back={{ href: "/admin/sermons", label: "Sermons" }}
        actions={
          <>
            {sermon.published && <ButtonLink href={`/sermons/${sermon.slug}`} icon="external" variant="secondary" external>View on website</ButtonLink>}
            <DeleteButton action={deleteSermon.bind(null, sermon.id)} />
          </>
        }
      />
      {saved && (
        <div className="mb-6">
          <Notice>{sermon.published ? "Sermon published — it's now on the website." : "Saved as a draft. Press Publish when it's ready."}</Notice>
        </div>
      )}
      <SermonForm sermon={sermon} />
    </>
  );
}
