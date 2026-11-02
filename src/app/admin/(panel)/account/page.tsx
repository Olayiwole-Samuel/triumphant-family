import type { Metadata } from "next";
import { TextField } from "@/components/admin/fields";
import { SimpleForm } from "@/components/admin/SimpleForm";
import { Card, PageHeader } from "@/components/admin/ui";
import { PASSWORD_MIN_LENGTH } from "@/lib/admin/password";
import { requireAdmin } from "@/lib/admin/session";
import { changeEmail, changePassword } from "../../auth-actions";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <>
      <PageHeader title="Account & password" description={`You sign in as ${admin.email}.`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Change password" description="Other devices are signed out when you change it.">
          <SimpleForm action={changePassword} submitLabel="Change password" pendingLabel="Saving…">
            <TextField name="current" label="Current password" type="password" autoComplete="current-password" required />
            <TextField
              name="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
              required
            />
            <TextField name="confirm" label="Type the new password again" type="password" autoComplete="new-password" required />
          </SimpleForm>
        </Card>
        <Card title="Sign-in email">
          <SimpleForm action={changeEmail} submitLabel="Update email" pendingLabel="Saving…">
            <TextField name="email" label="Email" type="email" defaultValue={admin.email} autoComplete="username" required />
            <TextField name="current" label="Your password (to confirm)" type="password" autoComplete="current-password" required />
          </SimpleForm>
        </Card>
      </div>
    </>
  );
}
