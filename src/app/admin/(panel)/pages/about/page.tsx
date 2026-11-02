import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { TextAreaField, TextField } from "@/components/admin/fields";
import { ImageField, ImageListField } from "@/components/admin/media-fields";
import { ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import { readSettings } from "@/lib/content/settings";
import { saveAboutPage } from "../actions";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "About page" };

export default async function AboutSettingsPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  const about = await readSettings("about");
  return (
    <>
      <PageHeader
        title="About page"
        description="Your story. Mission, vision and beliefs are edited in Church information; leaders in Leadership."
        actions={<ButtonLink href="/about" icon="external" variant="secondary" external>View page</ButtonLink>}
      />
      <AdminForm action={saveAboutPage}>
        <Card title="Top of the page">
          <TextField name="heroTitle" label="Headline" defaultValue={about.heroTitle} placeholder="Rooted in grace. Growing together." />
          <TextAreaField name="heroIntro" label="Introduction" defaultValue={about.heroIntro} rows={3} />
          <ImageField name="heroImage" label="Photo" defaultValue={about.heroImage} aspect="aspect-[16/9]" focalPoint />
        </Card>
        <Card title="Our story">
          <TextField name="storyHeading" label="Small label" defaultValue={about.storyHeading} placeholder="Our story" />
          <TextAreaField name="storyIntro" label="Opening line" defaultValue={about.storyIntro} rows={2} hint="Shown large, e.g. how the ministry began in one sentence." />
          <TextAreaField name="storyBody" label="The full story" defaultValue={about.storyBody} rows={12} formatting />
          <ImageListField name="storyImages" label="Story photos" defaultValue={about.storyImages ?? []} max={3} hint="Up to three photos shown beside the story." />
        </Card>
        <Card title="Invitation" description="The closing section inviting visitors to get in touch.">
          <TextField name="invitationHeading" label="Heading" defaultValue={about.invitationHeading} placeholder="There is a place for you here" />
          <TextAreaField name="invitationBody" label="Text" defaultValue={about.invitationBody} rows={3} />
        </Card>
      </AdminForm>
    </>
  );
}
