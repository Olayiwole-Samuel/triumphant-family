import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/ui";
import { isUuid } from "@/lib/admin/ids";
import { getDb, schema } from "@/lib/db";
import { deleteServiceTime } from "../actions";
import { ServiceTimeForm } from "../ServiceTimeForm";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Edit service time" };

export default async function EditServicePage({ params }: PageProps<"/admin/services/[id]">) {
  await requireAdmin(); // pages aren't protected by the layout's check
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [service] = await getDb().select().from(schema.serviceTimes).where(eq(schema.serviceTimes.id, id)).limit(1);
  if (!service) notFound();
  return (
    <>
      <PageHeader
        title={service.title}
        back={{ href: "/admin/services", label: "Service times" }}
        actions={<DeleteButton action={deleteServiceTime.bind(null, service.id)} />}
      />
      <ServiceTimeForm service={service} />
    </>
  );
}
