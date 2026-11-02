import { desc } from "drizzle-orm";
import { connection } from "next/server";
import { AdminForm } from "@/components/admin/AdminForm";
import { DateField, SelectField, SuggestField, TagsField, TextAreaField, TextField, ToggleField } from "@/components/admin/fields";
import { AudioField, ImageField } from "@/components/admin/media-fields";
import { PublishButtons } from "@/components/admin/PublishButtons";
import { Card } from "@/components/admin/ui";
import { sermonSuggestions } from "@/lib/admin/suggestions";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/utils/format";
import { churchNow } from "@/lib/utils/time";
import { saveSermon } from "./actions";

type SermonRow = typeof schema.sermons.$inferSelect;

export async function SermonForm({ sermon }: { sermon?: SermonRow }) {
  await connection(); // the default date is today
  const [suggestions, events] = await Promise.all([
    sermonSuggestions(),
    getDb()
      .select({ id: schema.events.id, title: schema.events.title, date: schema.events.date })
      .from(schema.events)
      .orderBy(desc(schema.events.date))
      .limit(200),
  ]);

  return (
    <AdminForm action={saveSermon.bind(null, sermon?.id ?? null)} buttons={<PublishButtons published={sermon?.published} />}>
      {sermon && <input type="hidden" name="existing" value="1" />}
      <Card title="The message">
        <TextField name="title" label="Title" defaultValue={sermon?.title} required />
        <div className="grid gap-5 sm:grid-cols-2">
          <DateField name="date" label="Date preached" defaultValue={sermon?.date ?? churchNow().date} required />
          <SuggestField name="speaker" label="Speaker" defaultValue={sermon?.speaker} suggestions={suggestions.speakers} placeholder="e.g. Pastor …" />
        </div>
        <SuggestField name="series" label="Series (optional)" defaultValue={sermon?.series} suggestions={suggestions.series} />
        <TextAreaField name="description" label="Summary" defaultValue={sermon?.description} rows={6} hint="What the message is about — shown on the sermon page." />
      </Card>

      <Card title="Video & audio" description="Add the YouTube video, an audio recording, or both.">
        <TextField name="youtubeUrl" label="YouTube link" type="url" defaultValue={sermon?.youtubeUrl} placeholder="https://www.youtube.com/watch?v=…" />
        <AudioField
          name="audioUrl"
          label="Audio recording"
          defaultValue={sermon?.audioUrl}
          defaultMime={sermon?.audioMimeType}
          hint="People can listen on the sermon page. MP3 up to 100 MB."
        />
        <ImageField
          name="thumbnail"
          label="Thumbnail (optional)"
          defaultValue={sermon?.thumbnail}
          aspect="aspect-video"
          hint="Leave empty to use the YouTube thumbnail."
        />
      </Card>

      <Card title="Scripture & topics" description="Topics power the filters on the Sermons page and “related messages”. Reuse the same words.">
        <TextField name="scripture" label="Main scripture" defaultValue={sermon?.scripture} placeholder="e.g. Romans 8:37" />
        <TagsField name="otherScriptures" label="Other scriptures" defaultValue={sermon?.otherScriptures ?? []} placeholder="Type a reference and press Enter" />
        <TagsField name="topics" label="Topics" defaultValue={sermon?.topics ?? []} suggestions={suggestions.topics} placeholder="e.g. Faith, Prayer — press Enter after each" />
      </Card>

      <Card title="More">
        <SelectField
          name="eventId"
          label="Preached at an event?"
          defaultValue={sermon?.eventId}
          placeholder="No — a regular service"
          hint="The message then also appears on that event's page."
          options={events.map((event) => ({ value: event.id, label: `${event.title}${event.date ? ` — ${formatDate(event.date)}` : ""}` }))}
        />
        <TextField
          name="slug"
          label="Web address"
          defaultValue={sermon?.slug}
          hint={sermon ? `The page is /sermons/${sermon.slug}. Changing it breaks links people have already shared.` : "Leave empty — it's created from the title."}
        />
        <ToggleField name="featured" label="Feature this sermon" hint="Shown as the main message on the Home and Sermons pages (unless the Home page picks another)." defaultChecked={sermon?.featured} />
      </Card>
    </AdminForm>
  );
}
