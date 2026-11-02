import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/admin/AuthCard";
import { TextField } from "@/components/admin/fields";
import { SimpleForm } from "@/components/admin/SimpleForm";
import { PASSWORD_MIN_LENGTH } from "@/lib/admin/password";
import { adminExists, setupCodeRequired } from "@/lib/admin/session";
import { createFirstAdmin } from "../auth-actions";

export const metadata: Metadata = { title: "Set up" };

async function Setup() {
  // Only while no admin account exists — afterwards this page just sends you to sign in.
  if (await adminExists()) redirect("/admin/login");
  const needsCode = setupCodeRequired();

  return (
    <AuthCard
      title="Create your admin account"
      description="This is the one login for managing the website. You'll use this email and password to sign in."
    >
      <SimpleForm action={createFirstAdmin} submitLabel="Create account" pendingLabel="Creating…">
        {needsCode && (
          <TextField
            name="setupCode"
            label="Setup code"
            hint="The ADMIN_SETUP_CODE value from your hosting settings — it proves you own the site."
            autoComplete="off"
            required
          />
        )}
        <TextField name="email" label="Your email" type="email" autoComplete="username" inputMode="email" required />
        <TextField
          name="password"
          label="Choose a password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters. A short sentence is easy to remember and hard to guess.`}
          required
        />
        <TextField name="confirm" label="Type the password again" type="password" autoComplete="new-password" required />
      </SimpleForm>
    </AuthCard>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <Setup />
    </Suspense>
  );
}
