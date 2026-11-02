import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/ui";
import { isUuid } from "@/lib/admin/ids";
import { getDb, schema } from "@/lib/db";
import { deleteLeader } from "../actions";
import { LeaderForm } from "../LeaderForm";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Edit leader" };

export default async function EditLeaderPage({ params }: PageProps<"/admin/leaders/[id]">) {
  await requireAdmin(); // pages aren't protected by the layout's check
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [leader] = await getDb().select().from(schema.leaders).where(eq(schema.leaders.id, id)).limit(1);
  if (!leader) notFound();
  return (
    <>
      <PageHeader
        title={leader.name}
        back={{ href: "/admin/leaders", label: "Leadership" }}
        actions={<DeleteButton action={deleteLeader.bind(null, leader.id)} />}
      />
      <LeaderForm leader={leader} />
    </>
  );
}
