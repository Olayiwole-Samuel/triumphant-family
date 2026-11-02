import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { AlbumForm } from "../AlbumForm";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "New album" };

export default async function NewAlbumPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  return (
    <>
      <PageHeader title="New photo album" back={{ href: "/admin/gallery", label: "Photo gallery" }} description="Name the album and save — then upload the photos." />
      <AlbumForm />
    </>
  );
}
