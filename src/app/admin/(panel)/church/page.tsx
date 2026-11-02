import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { TextAreaField, TextField } from "@/components/admin/fields";
import { ListField } from "@/components/admin/ListField";
import { ImageField } from "@/components/admin/media-fields";
import { Card, PageHeader } from "@/components/admin/ui";
import { CHURCH_NAME, CHURCH_YOUTUBE_CHANNEL_ID, CHURCH_YOUTUBE_CHANNEL_URL, MINISTRY_NAME } from "@/content/church";
import { readSettings } from "@/lib/content/settings";
import { saveChurchInfo } from "./actions";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Church information" };

const PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X (Twitter)" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

export default async function ChurchInfoPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  const site = await readSettings("site");
  return (
    <>
      <PageHeader
        title="Church information"
        description="Name, contact details, logo and beliefs — used in the header, footer, Contact, About and everywhere else."
      />
      <AdminForm action={saveChurchInfo}>
        <Card title="Name & identity">
          <TextField name="churchName" label="Church name" defaultValue={site.churchName ?? CHURCH_NAME} required />
          <TextField name="ministryName" label="Ministry name" defaultValue={site.ministryName ?? MINISTRY_NAME} />
          <TextField name="tagline" label="Tagline" defaultValue={site.tagline} hint="A short line used in the page title, e.g. “A family of faith. A people of purpose.”" />
          <TextAreaField
            name="description"
            label="Short description"
            defaultValue={site.description}
            rows={3}
            maxLength={300}
            hint="One or two sentences shown by Google and when the website is shared."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <ImageField name="logo" label="Logo" defaultValue={site.logo} aspect="aspect-square" hint="A square PNG with a transparent background works best." />
            <ImageField
              name="shareImage"
              label="Sharing image"
              defaultValue={site.shareImage}
              aspect="aspect-[1200/630]"
              hint="Shown when the website is shared on WhatsApp, Facebook, etc. Ideal size 1200 × 630."
            />
          </div>
        </Card>

        <Card title="Contact & location" description="Leave anything you don't want to publish empty — it simply won't be shown.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="contactEmail" label="Email" type="email" defaultValue={site.contactEmail} />
            <TextField name="phone" label="Phone" type="tel" defaultValue={site.phone} placeholder="+234 …" />
          </div>
          <TextAreaField name="address" label="Address" defaultValue={site.address} rows={3} />
          <TextField name="mapUrl" label="Map link" type="url" defaultValue={site.mapUrl} hint="Open the church on Google Maps → Share → Copy link, and paste it here." />
          <TextAreaField name="officeHours" label="Office hours" defaultValue={site.officeHours} rows={2} placeholder="e.g. Monday–Friday, 9am–4pm" />
        </Card>

        <Card title="YouTube" description="Your channel's latest videos and live services appear on the website automatically.">
          <TextField name="youtubeChannelUrl" label="YouTube channel link" type="url" defaultValue={site.youtubeChannelUrl ?? CHURCH_YOUTUBE_CHANNEL_URL} />
          <TextField
            name="youtubeChannelId"
            label="YouTube channel ID"
            defaultValue={site.youtubeChannelId ?? CHURCH_YOUTUBE_CHANNEL_ID}
            hint="Starts with “UC”. Find it in YouTube Studio → Settings → Channel → Advanced settings."
          />
        </Card>

        <Card title="Social media">
          <ListField
            name="socialLinks"
            label="Social links"
            hint="Shown in the footer and menu."
            defaultValue={site.socialLinks ?? []}
            newItem={{ platform: "facebook", url: "" }}
            addLabel="Add a social link"
            titleKey="platform"
            itemNoun="Link"
            columns={[
              { key: "platform", label: "Platform", type: "select", options: PLATFORM_OPTIONS },
              { key: "url", label: "Link", type: "url", placeholder: "https://…" },
            ]}
          />
        </Card>

        <Card title="Mission, vision & beliefs" description="Shown on the About page; belief titles also scroll across the Home page.">
          <TextAreaField name="mission" label="Mission" defaultValue={site.mission} rows={3} />
          <TextAreaField name="vision" label="Vision" defaultValue={site.vision} rows={3} />
          <ListField
            name="beliefs"
            label="What we believe"
            defaultValue={site.beliefs ?? []}
            newItem={{ title: "", description: "" }}
            addLabel="Add a belief"
            titleKey="title"
            itemNoun="Belief"
            columns={[
              { key: "title", label: "Belief", wide: true, placeholder: "e.g. The authority of Scripture" },
              { key: "description", label: "Explanation (optional)", type: "textarea" },
            ]}
          />
        </Card>
      </AdminForm>
    </>
  );
}
