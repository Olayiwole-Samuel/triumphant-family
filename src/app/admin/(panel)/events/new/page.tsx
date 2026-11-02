import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { EventForm } from "../EventForm";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Add event" };

export default async function NewEventPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  return (
    <>
      <PageHeader
        title="Add an event"
        back={{ href: "/admin/events", label: "Events" }}
        description="Save it first — then you can also upload photos from the event."
      />
      <EventForm />
    </>
  );
}
