import { desc } from "drizzle-orm";
import { AdminForm } from "@/components/admin/AdminForm";
import { DateField, NumberField, SelectField, SuggestField, TextAreaField, TextField, ToggleField } from "@/components/admin/fields";
import { PublishButtons } from "@/components/admin/PublishButtons";
import { Card } from "@/components/admin/ui";
import { albumCategories } from "@/lib/admin/suggestions";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/utils/format";
import { saveAlbum } from "./actions";

export async function AlbumForm({ album }: { album?: typeof schema.galleryAlbums.$inferSelect }) {
  const [categories, events] = await Promise.all([
    albumCategories(),
    getDb()
      .select({ id: schema.events.id, title: schema.events.title, date: schema.events.date })
      .from(schema.events)
      .orderBy(desc(schema.events.date))
      .limit(200),
  ]);
  return (
    <AdminForm
      action={saveAlbum.bind(null, album?.id ?? null)}
      buttons={<PublishButtons published={album?.published ?? false} />}
      idleHint={album ? undefined : "Save the album, then add photos."}
    >
      {album && <input type="hidden" name="existing" value="1" />}
      <Card title="Album details">
        <TextField name="title" label="Album name" defaultValue={album?.title} required placeholder="e.g. Easter Sunday 2026" />
        <div className="grid gap-5 sm:grid-cols-2">
          <DateField name="date" label="Date" defaultValue={album?.date} />
          <SuggestField name="category" label="Category" defaultValue={album?.category} suggestions={categories} placeholder="e.g. Worship, Youth" hint="The gallery shows category filters once two or more are used." />
        </div>
        <TextAreaField name="description" label="Description" defaultValue={album?.description} rows={3} />
        <SelectField
          name="eventId"
          label="Photos from an event?"
          defaultValue={album?.eventId}
          placeholder="No"
          hint="Linked albums also appear on that event's page."
          options={events.map((event) => ({ value: event.id, label: `${event.title}${event.date ? ` — ${formatDate(event.date)}` : ""}` }))}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <ToggleField name="featured" label="Feature this album" hint="Shown first in the gallery." defaultChecked={album?.featured} />
          <NumberField name="sortOrder" label="Display order" defaultValue={album?.sortOrder} min={0} hint="Lower first. Empty = by date." />
        </div>
      </Card>
    </AdminForm>
  );
}
