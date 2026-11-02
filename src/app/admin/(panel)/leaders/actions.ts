"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { FormReader, success, type FormState } from "@/lib/admin/form";
import { refreshPublic } from "@/lib/admin/revalidate";
import { requireAdmin } from "@/lib/admin/session";
import { getDb, schema } from "@/lib/db";

export async function saveLeader(id: string | null, _state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);
  const values = {
    name: form.text("name", { label: "Name", required: true, max: 120 }) ?? "",
    role: form.text("role", { label: "Role", required: true, max: 120 }) ?? "",
    bio: form.text("bio", { label: "Biography", max: 2000 }) ?? null,
    photo: form.image("photo", { label: "Photo" }) ?? null,
    showPhoto: form.bool("showPhoto"),
    sortOrder: form.int("sortOrder", { label: "Order", min: 0, max: 999 }) ?? null,
    published: form.bool("published"),
  };
  if (!form.ok) return form.fail();

  const db = getDb();
  if (id) await db.update(schema.leaders).set(values).where(eq(schema.leaders.id, id));
  else await db.insert(schema.leaders).values(values);
  refreshPublic("leader");
  if (!id) redirect("/admin/leaders");
  return success("Leader saved.");
}

export async function deleteLeader(id: string) {
  await requireAdmin();
  await getDb().delete(schema.leaders).where(eq(schema.leaders.id, id));
  refreshPublic("leader");
  redirect("/admin/leaders");
}
