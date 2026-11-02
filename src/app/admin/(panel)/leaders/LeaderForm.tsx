import { AdminForm } from "@/components/admin/AdminForm";
import { NumberField, TextAreaField, TextField, ToggleField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/media-fields";
import { Card } from "@/components/admin/ui";
import type { schema } from "@/lib/db";
import { saveLeader } from "./actions";

export function LeaderForm({ leader }: { leader?: typeof schema.leaders.$inferSelect }) {
  return (
    <AdminForm action={saveLeader.bind(null, leader?.id ?? null)}>
      <Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Name" defaultValue={leader?.name} required />
          <TextField name="role" label="Role" defaultValue={leader?.role} placeholder="Senior Pastor" required />
        </div>
        <TextAreaField name="bio" label="Biography" defaultValue={leader?.bio} rows={5} />
      </Card>
      <Card title="Photo">
        <ImageField name="photo" label="Portrait" defaultValue={leader?.photo} aspect="aspect-[4/5]" focalPoint />
        <ToggleField
          name="showPhoto"
          label="Show photo on the website"
          hint="Off keeps the photo saved here but never sends it to the website — the leader appears as a text card."
          defaultChecked={leader?.showPhoto ?? true}
        />
      </Card>
      <Card>
        <NumberField name="sortOrder" label="Order" defaultValue={leader?.sortOrder} min={0} hint="Lower numbers are shown first. The Home page shows the first three." />
        <ToggleField name="published" label="Show on website" defaultChecked={leader?.published ?? true} />
      </Card>
    </AdminForm>
  );
}
