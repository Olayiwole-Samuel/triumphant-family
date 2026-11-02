import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { SelectField, TextAreaField, TextField } from "@/components/admin/fields";
import { ImageField, ImageListField } from "@/components/admin/media-fields";
import { ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import { readSettings } from "@/lib/content/settings";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/utils/format";
import { saveHomePage } from "../actions";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Home page" };

export default async function HomeSettingsPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  const db = getDb();
  const [home, sermons, events] = await Promise.all([
    readSettings("home"),
    db
      .select({ id: schema.sermons.id, title: schema.sermons.title, date: schema.sermons.date })
      .from(schema.sermons)
      .where(eq(schema.sermons.published, true))
      .orderBy(desc(schema.sermons.date))
      .limit(100),
    db
      .select({ id: schema.events.id, title: schema.events.title, date: schema.events.date })
      .from(schema.events)
      .where(eq(schema.events.published, true))
      .orderBy(desc(schema.events.date))
      .limit(100),
  ]);

  return (
    <>
      <PageHeader
        title="Home page"
        description="The first page visitors see. Service times, sermons, events, leaders and giving fill in automatically from their own sections."
        actions={<ButtonLink href="/" icon="external" variant="secondary" external>View page</ButtonLink>}
      />
      <AdminForm action={saveHomePage}>
        <Card title="Top of the page" description="The big welcome at the very top.">
          <TextField name="heroEyebrow" label="Small heading" defaultValue={home.heroEyebrow} placeholder="The Gleam of Salvation Apostolic Ministry" />
          <TextField name="heroTitle" label="Headline" defaultValue={home.heroTitle} placeholder="A FAMILY OF FAITH. A PEOPLE OF PURPOSE." hint="Keep it short — a few powerful words." />
          <TextAreaField name="heroSubtitle" label="Introduction" defaultValue={home.heroSubtitle} rows={3} />
          <ImageField name="heroImage" label="Photo" defaultValue={home.heroImage} aspect="aspect-[16/9]" focalPoint hint="A wide, high-quality photo of the church family or worship." />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="primaryLabel" label="Main button text" defaultValue={home.primaryCta?.label} placeholder="Watch & Listen" />
            <TextField name="primaryHref" label="Main button goes to" defaultValue={home.primaryCta?.href} placeholder="/watch" />
            <TextField name="secondaryLabel" label="Second button text" defaultValue={home.secondaryCta?.label} placeholder="Discover Our Family" />
            <TextField name="secondaryHref" label="Second button goes to" defaultValue={home.secondaryCta?.href} placeholder="/about" />
          </div>
        </Card>

        <Card title="Welcome section">
          <TextField name="welcomeHeading" label="Heading" defaultValue={home.welcomeHeading} placeholder="Welcome home" />
          <TextAreaField name="welcomeStatement" label="Statement" defaultValue={home.welcomeStatement} rows={2} hint="One bold sentence." />
          <TextAreaField name="welcomeBody" label="Welcome message" defaultValue={home.welcomeBody} rows={5} />
          <ImageField name="welcomeImage" label="Photo" defaultValue={home.welcomeImage} aspect="aspect-[4/5]" focalPoint />
        </Card>

        <Card title="Scripture">
          <TextAreaField name="scriptureText" label="Verse" defaultValue={home.scriptureText} rows={3} />
          <TextField name="scriptureReference" label="Reference" defaultValue={home.scriptureReference} placeholder="2 Corinthians 2:14 (KJV)" />
        </Card>

        <Card title="Featured" description="Choose what leads each section. Leave on “Automatic” to use the newest.">
          <SelectField
            name="featuredSermonId"
            label="Featured sermon"
            defaultValue={home.featuredSermonId}
            placeholder="Automatic (marked “Feature this”, else the newest)"
            options={sermons.map((sermon) => ({ value: sermon.id, label: `${sermon.title} — ${formatDate(sermon.date)}` }))}
          />
          <SelectField
            name="featuredEventId"
            label="Featured event"
            defaultValue={home.featuredEventId}
            placeholder="Automatic (soonest upcoming)"
            hint="Shown first in the events section while it's still upcoming."
            options={events.map((event) => ({ value: event.id, label: `${event.title}${event.date ? ` — ${formatDate(event.date)}` : ""}` }))}
          />
        </Card>

        <Card title="Photo story" description="Photos that scroll across the Home page. Leave empty to use photos from your newest featured albums.">
          <ImageListField name="galleryHighlights" label="Photos" defaultValue={home.galleryHighlights ?? []} max={12} />
        </Card>
      </AdminForm>
    </>
  );
}
