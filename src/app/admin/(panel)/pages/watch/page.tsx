import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { TextAreaField, TextField, ToggleField } from "@/components/admin/fields";
import { ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import { readSettings } from "@/lib/content/settings";
import { saveWatchPage } from "../actions";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Watch page" };

export default async function WatchSettingsPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  const watch = await readSettings("watch");
  return (
    <>
      <PageHeader
        title="Watch page"
        description="Live services and recent videos come from your YouTube channel automatically."
        actions={<ButtonLink href="/watch" icon="external" variant="secondary" external>View page</ButtonLink>}
      />
      <AdminForm action={saveWatchPage}>
        <Card title="Top of the page">
          <TextField name="heading" label="Headline" defaultValue={watch.heading} placeholder="WATCH & EXPERIENCE" />
          <TextAreaField name="intro" label="Introduction" defaultValue={watch.intro} rows={3} />
        </Card>
        <Card title="Featured video" description="Shown large when the church isn't live. Leave empty to use the featured sermon or the latest upload.">
          <TextField name="featuredVideoUrl" label="YouTube link" type="url" defaultValue={watch.featuredVideoUrl} placeholder="https://www.youtube.com/watch?v=…" />
          <TextField name="featuredVideoTitle" label="Title (optional)" defaultValue={watch.featuredVideoTitle} />
        </Card>
        <Card title="Live services">
          <ToggleField
            name="useYouTubeApi"
            label="Check YouTube for live services"
            hint="Shows “Live now” automatically when a service is streaming (needs the YouTube API key on the server)."
            defaultChecked={watch.useYouTubeApi !== false}
          />
          <TextField
            name="manualStreamUrl"
            label="Manual livestream link (backup)"
            type="url"
            defaultValue={watch.manualStreamUrl}
            hint="Only shown when live checking isn't available, and labelled “shared by the church team”. Clear it after the service."
          />
          <TextField name="manualStreamNote" label="Note shown with it" defaultValue={watch.manualStreamNote} placeholder="e.g. Sunday service, 9am" />
        </Card>
      </AdminForm>
    </>
  );
}
