import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { TextAreaField, TextField, ToggleField } from "@/components/admin/fields";
import { ListField } from "@/components/admin/ListField";
import { ButtonLink, Card, PageHeader } from "@/components/admin/ui";
import { readSettings } from "@/lib/content/settings";
import { saveGiving } from "../actions";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Giving" };

export default async function GivingSettingsPage() {
  await requireAdmin(); // pages aren't protected by the layout's check
  const giving = await readSettings("giving");
  return (
    <>
      <PageHeader
        title="Giving"
        description="Bank details for the Give page. Double-check the account number — visitors copy it exactly."
        actions={<ButtonLink href="/give" icon="external" variant="secondary" external>View page</ButtonLink>}
      />
      <AdminForm action={saveGiving}>
        <Card>
          <ToggleField
            name="active"
            label="Show giving details on the website"
            hint="Switch off to hide the bank details (the page then says details are being prepared)."
            defaultChecked={giving.active !== false}
          />
        </Card>
        <Card title="Bank details">
          <TextField name="bankName" label="Bank name" defaultValue={giving.bankName} />
          <TextField name="accountName" label="Account name" defaultValue={giving.accountName} />
          <TextField name="accountNumber" label="Account number" defaultValue={giving.accountNumber} inputMode="numeric" />
          <TextAreaField
            name="additionalInstructions"
            label="Instructions"
            defaultValue={giving.additionalInstructions}
            rows={3}
            hint="e.g. what to write as the transfer reference."
          />
        </Card>
        <Card title="Why we give">
          <TextField name="heading" label="Headline" defaultValue={giving.heading} placeholder="Partner with what God is doing" />
          <TextAreaField name="introduction" label="Message" defaultValue={giving.introduction} rows={4} />
          <TextAreaField name="scriptureText" label="Scripture" defaultValue={giving.scriptureText} rows={3} />
          <TextField name="scriptureReference" label="Reference" defaultValue={giving.scriptureReference} placeholder="2 Corinthians 9:7 (KJV)" />
        </Card>
        <Card title="Ways to give" description="Optional: e.g. Tithes, Offerings, Building fund.">
          <ListField
            name="categories"
            label="Categories"
            defaultValue={giving.categories ?? []}
            newItem={{ title: "", description: "" }}
            addLabel="Add a category"
            titleKey="title"
            itemNoun="Category"
            columns={[
              { key: "title", label: "Name", wide: true },
              { key: "description", label: "Description (optional)", type: "textarea" },
            ]}
          />
        </Card>
      </AdminForm>
    </>
  );
}
