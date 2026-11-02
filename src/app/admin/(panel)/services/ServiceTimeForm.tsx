import { AdminForm } from "@/components/admin/AdminForm";
import { NumberField, SelectField, TextAreaField, TextField, TimeField, ToggleField } from "@/components/admin/fields";
import { Card } from "@/components/admin/ui";
import type { schema } from "@/lib/db";
import { saveServiceTime } from "./actions";

const DAY_OPTIONS = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
];

export function ServiceTimeForm({ service }: { service?: typeof schema.serviceTimes.$inferSelect }) {
  return (
    <AdminForm action={saveServiceTime.bind(null, service?.id ?? null)}>
      <Card>
        <TextField name="title" label="Name" defaultValue={service?.title} placeholder="Sunday Worship Experience" required />
        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField name="day" label="Day" defaultValue={service?.day ?? "sunday"} options={DAY_OPTIONS} />
          <TimeField name="startTime" label="Starts" defaultValue={service?.startTime} required />
          <TimeField name="endTime" label="Ends" defaultValue={service?.endTime} />
        </div>
        <p className="-mt-2 text-[0.8125rem] text-plum-950/55">Times are Lagos time (WAT).</p>
        <TextField name="location" label="Location" defaultValue={service?.location} placeholder="Main Auditorium & Online" />
        <TextAreaField name="description" label="Extra information" defaultValue={service?.description} rows={2} />
        <NumberField name="sortOrder" label="Order" defaultValue={service?.sortOrder} min={0} hint="Lower numbers are listed first. Leave empty to sort by time." />
        <ToggleField name="published" label="Show on website" defaultChecked={service?.published ?? true} />
      </Card>
    </AdminForm>
  );
}
