import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { SermonForm } from "../SermonForm";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Add sermon" };

export default async function NewSermonPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  return (
    <>
      <PageHeader title="Add a sermon" back={{ href: "/admin/sermons", label: "Sermons" }} />
      <SermonForm />
    </>
  );
}
