import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { TextAreaField, TextField } from "@/components/admin/fields";
import { ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import { readSettings } from "@/lib/content/settings";
import { saveEventsPage } from "../actions";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Events page" };

export default async function EventsSettingsPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  const page = await readSettings("events");
  return (
    <>
      <PageHeader
        title="Events page"
        description="The heading of /events. The events themselves are managed under Events."
        actions={
          <>
            <ButtonLink href="/admin/events" icon="calendar" variant="secondary">Manage events</ButtonLink>
            <ButtonLink href="/events" icon="external" variant="secondary" external>View page</ButtonLink>
          </>
        }
      />
      <AdminForm action={saveEventsPage}>
        <Card>
          <TextField name="heading" label="Headline" defaultValue={page.heading} placeholder="GATHER. GROW. BELONG." />
          <TextAreaField name="intro" label="Introduction" defaultValue={page.intro} rows={3} />
        </Card>
      </AdminForm>
    </>
  );
}
