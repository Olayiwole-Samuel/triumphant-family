import { connection } from "next/server";
import { AdminForm } from "@/components/admin/AdminForm";
import { DateField, SelectField, SuggestField, TextAreaField, TextField, TimeField, ToggleField } from "@/components/admin/fields";
import { ListField } from "@/components/admin/ListField";
import { ImageField } from "@/components/admin/media-fields";
import { PublishButtons } from "@/components/admin/PublishButtons";
import { SectionNav } from "@/components/admin/SectionNav";
import { ShowWhen } from "@/components/admin/ShowWhen";
import { Card } from "@/components/admin/ui";
import { eventSuggestions } from "@/lib/admin/suggestions";
import type { schema } from "@/lib/db";
import { EVENT_TIMEZONES } from "@/lib/events/time";
import { saveEvent } from "./actions";

type EventRow = typeof schema.events.$inferSelect;

const FORMAT_OPTIONS = [
  { value: "in-person", label: "In person" },
  { value: "online", label: "Online only" },
  { value: "hybrid", label: "In person & online (hybrid)" },
];

const VIDEO_KIND_OPTIONS = [
  { value: "sermon", label: "Sermon / message" },
  { value: "highlight", label: "Highlights" },
  { value: "worship", label: "Worship / ministration" },
  { value: "other", label: "Other" },
];

const TESTIMONY_KIND_OPTIONS = [
  { value: "written", label: "Written" },
  { value: "video", label: "Video (YouTube)" },
];

export const EVENT_SECTIONS = [
  { id: "details", label: "Details" },
  { id: "when", label: "Date & time" },
  { id: "where", label: "Venue & online" },
  { id: "registration", label: "Registration" },
  { id: "programme", label: "Programme" },
  { id: "recap", label: "Recap & videos" },
  { id: "testimonies", label: "Testimonies" },
];

export async function EventForm({ event, showPhotosTab }: { event?: EventRow; showPhotosTab?: boolean }) {
  await connection();
  const suggestions = await eventSuggestions();

  return (
    <>
      <SectionNav sections={showPhotosTab ? [...EVENT_SECTIONS, { id: "photos", label: "Photos" }] : EVENT_SECTIONS} />
      <AdminForm action={saveEvent.bind(null, event?.id ?? null)} buttons={<PublishButtons published={event?.published} />}>
        {event && <input type="hidden" name="existing" value="1" />}

        <Card id="details" title="Details">
          <TextField name="title" label="Event name" defaultValue={event?.title} required placeholder="e.g. Holy Ghost Convention" />
          <TextAreaField name="summary" label="Short summary" defaultValue={event?.summary} rows={2} maxLength={300} hint="One or two sentences for event cards and search results." />
          <TextAreaField name="description" label="Full description" defaultValue={event?.description} rows={6} formatting />
          <div className="grid gap-5 sm:grid-cols-2">
            <SuggestField name="category" label="Category" defaultValue={event?.category} suggestions={suggestions.categories} placeholder="e.g. Conference, Youth, Outreach" />
            <SuggestField
              name="series"
              label="Yearly event name (optional)"
              defaultValue={event?.series}
              suggestions={suggestions.series}
              hint="For events that happen every year: use the same name each year and the event pages link to each other (“Other years”)."
            />
          </div>
          <ImageField name="flyer" label="Event image or flyer" defaultValue={event?.flyer} aspect="aspect-[4/5]" />
          <ToggleField name="featured" label="Feature this event" hint="Shown large at the top of the Events page while it's upcoming." defaultChecked={event?.featured} />
        </Card>

        <Card id="when" title="Date & time" description="Leave the date empty if it isn't confirmed — the website then says “Date to be announced”.">
          <div className="grid gap-5 sm:grid-cols-2">
            <DateField name="date" label="Start date" defaultValue={event?.date} />
            <DateField name="endDate" label="End date (multi-day events only)" defaultValue={event?.endDate} />
          </div>
          <ToggleField name="allDay" label="All-day event" defaultChecked={event?.allDay} />
          <ShowWhen field="allDay" is="off">
            <div className="grid gap-5 sm:grid-cols-2">
              <TimeField name="startTime" label="Start time" defaultValue={event?.startTime} />
              <TimeField name="endTime" label="End time" defaultValue={event?.endTime} hint="Needed for “Add to calendar”." />
            </div>
          </ShowWhen>
          <SelectField
            name="timezone"
            label="Time zone"
            defaultValue={event?.timezone ?? "Africa/Lagos"}
            options={EVENT_TIMEZONES.map((zone) => ({ value: zone.value, label: zone.label }))}
            hint="Times are the local time where the event happens."
          />
        </Card>

        <Card id="where" title="Venue & online">
          <SelectField name="format" label="Event format" defaultValue={event?.format ?? "in-person"} options={FORMAT_OPTIONS} />
          <ShowWhen field="format" is={["in-person", "hybrid"]}>
            <SuggestField name="location" label="Venue" defaultValue={event?.location} suggestions={suggestions.venues} placeholder="e.g. Main Auditorium" />
            <TextAreaField name="address" label="Address" defaultValue={event?.address} rows={2} />
            <TextField name="mapUrl" label="Map / directions link" type="url" defaultValue={event?.mapUrl} hint="Optional — without it, “Get directions” searches Google Maps for the address." />
          </ShowWhen>
          <ShowWhen field="format" is={["online", "hybrid"]}>
            <TextField name="onlineUrl" label="Online link" type="url" defaultValue={event?.onlineUrl} placeholder="YouTube, Zoom or Facebook link" />
          </ShowWhen>
        </Card>

        <Card id="registration" title="Registration" description="The website never takes registrations itself — the button opens your form (Google Forms, Eventbrite…).">
          <ToggleField name="registrationRequired" label="Registration required" defaultChecked={event?.registrationRequired} />
          <ShowWhen field="registrationRequired" is="on">
            <TextField name="registrationUrl" label="Registration link" type="url" defaultValue={event?.registrationUrl} />
            <DateField name="registrationDeadline" label="Registration deadline (optional)" defaultValue={event?.registrationDeadline} />
            <TextAreaField name="registrationNote" label="Instructions (optional)" defaultValue={event?.registrationNote} rows={2} />
          </ShowWhen>
          <TextField name="moreInfoUrl" label="More information / tickets link (optional)" type="url" defaultValue={event?.moreInfoUrl} />
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField name="contactName" label="Contact person" defaultValue={event?.contactName} />
            <TextField name="contactEmail" label="Contact email" type="email" defaultValue={event?.contactEmail} />
            <TextField name="contactPhone" label="Contact phone" type="tel" defaultValue={event?.contactPhone} />
          </div>
        </Card>

        <Card id="programme" title="Programme" description="Optional: the order of events, day by day or hour by hour.">
          <ListField
            name="schedule"
            label="Programme items"
            defaultValue={event?.schedule ?? []}
            newItem={{ time: "", title: "", note: "" }}
            addLabel="Add programme item"
            titleKey="title"
            itemNoun="Item"
            columns={[
              { key: "time", label: "Time or day", placeholder: "e.g. 9:00 am, or Day 2" },
              { key: "title", label: "What happens", placeholder: "e.g. Opening worship" },
              { key: "note", label: "Note (optional)", wide: true },
            ]}
          />
        </Card>

        <Card
          id="recap"
          title="Recap — after the event"
          description="Look back on what God did. Shown on the event page once it has happened — so years from now, everyone can come back to watch and read."
        >
          <TextAreaField
            name="recapBody"
            label="What happened"
            defaultValue={event?.recapBody}
            rows={10}
            formatting
            hint="A summary of the event and the messages preached — main points, scriptures, highlights."
          />
          <ListField
            name="recapVideos"
            label="Videos from the event"
            hint="Sermons, highlights and ministrations on YouTube. (Sermons you add under Sermons and link to this event appear here automatically.)"
            defaultValue={event?.recapVideos ?? []}
            newItem={{ title: "", url: "", kind: "sermon", speaker: "", note: "" }}
            addLabel="Add a video"
            titleKey="title"
            itemNoun="Video"
            columns={[
              { key: "title", label: "Title", placeholder: "e.g. Day 1 — Opening message" },
              { key: "url", label: "YouTube link", type: "url", placeholder: "https://www.youtube.com/watch?v=…" },
              { key: "kind", label: "Type", type: "select", options: VIDEO_KIND_OPTIONS },
              { key: "speaker", label: "Speaker (optional)" },
              { key: "note", label: "Note (optional)", wide: true },
            ]}
          />
        </Card>

        <Card
          id="testimonies"
          title="Testimonies"
          description="Written testimonies, or a YouTube link for video testimonies. Only those switched to “Show on website” appear."
        >
          <ListField
            name="testimonies"
            label="Testimonies"
            defaultValue={event?.testimonies ?? []}
            newItem={{ name: "", kind: "written", body: "", videoUrl: "", location: "", published: true }}
            addLabel="Add a testimony"
            titleKey="name"
            itemNoun="Testimony"
            max={200}
            columns={[
              { key: "name", label: "Name", placeholder: "e.g. Sister Ada O. (or Anonymous)" },
              { key: "kind", label: "Type", type: "select", options: TESTIMONY_KIND_OPTIONS },
              { key: "body", label: "Testimony", type: "textarea", showWhen: { key: "kind", value: "written" } },
              { key: "videoUrl", label: "YouTube link", type: "url", wide: true, showWhen: { key: "kind", value: "video" } },
              { key: "location", label: "Where they're from (optional)", wide: true },
              { key: "published", label: "Show on website", type: "toggle", hint: "Check with the person before publishing their testimony." },
            ]}
          />
        </Card>

        <Card title="Web address">
          <TextField
            name="slug"
            label="Web address"
            defaultValue={event?.slug}
            hint={event ? `The page is /events/${event.slug}. Changing it breaks links already shared.` : "Leave empty — it's created from the name and year."}
          />
        </Card>
      </AdminForm>
    </>
  );
}
