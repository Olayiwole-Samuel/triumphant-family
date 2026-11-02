"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { FormReader, success, type FormState } from "@/lib/admin/form";
import { refreshPublic } from "@/lib/admin/revalidate";
import { requireAdmin } from "@/lib/admin/session";
import { getDb, schema } from "@/lib/db";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export async function saveServiceTime(id: string | null, _state: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const form = new FormReader(data);
  const values = {
    title: form.text("title", { label: "Name", required: true, max: 120 }) ?? "",
    day: form.choice("day", WEEKDAYS, "sunday"),
    startTime: form.time("startTime", { label: "Start time", required: true }) ?? "",
    endTime: form.time("endTime", { label: "End time" }) ?? null,
    location: form.text("location", { label: "Location", max: 160 }) ?? null,
    description: form.text("description", { label: "Extra information", max: 500 }) ?? null,
    sortOrder: form.int("sortOrder", { label: "Order", min: 0, max: 999 }) ?? null,
    published: form.bool("published"),
  };
  if (values.startTime && values.endTime && values.endTime <= values.startTime) {
    form.error("endTime", "The end time must be after the start time.");
  }
  if (!form.ok) return form.fail();

  const db = getDb();
  if (id) await db.update(schema.serviceTimes).set(values).where(eq(schema.serviceTimes.id, id));
  else await db.insert(schema.serviceTimes).values(values);
  refreshPublic("serviceTime");
  if (!id) redirect("/admin/services");
  return success("Service time saved.");
}

export async function deleteServiceTime(id: string) {
  await requireAdmin();
  await getDb().delete(schema.serviceTimes).where(eq(schema.serviceTimes.id, id));
  refreshPublic("serviceTime");
  redirect("/admin/services");
}
