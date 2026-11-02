import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { LeaderForm } from "../LeaderForm";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Add leader" };

export default async function NewLeaderPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  return (
    <>
      <PageHeader title="Add a leader" back={{ href: "/admin/leaders", label: "Leadership" }} />
      <LeaderForm />
    </>
  );
}
