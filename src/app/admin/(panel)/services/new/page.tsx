import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { ServiceTimeForm } from "../ServiceTimeForm";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Add service time" };

export default async function NewServicePage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  return (
    <>
      <PageHeader title="Add a service time" back={{ href: "/admin/services", label: "Service times" }} />
      <ServiceTimeForm />
    </>
  );
}
