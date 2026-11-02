import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/admin/AuthCard";
import { TextField } from "@/components/admin/fields";
import { SimpleForm } from "@/components/admin/SimpleForm";
import { adminExists, getAdmin } from "@/lib/admin/session";
import { signIn } from "../auth-actions";

export const metadata: Metadata = { title: "Sign in" };

async function SignIn() {
  if (await getAdmin()) redirect("/admin");
  if (!(await adminExists().catch(() => true))) redirect("/admin/setup");

  return (
    <AuthCard title="Sign in" description="Manage the website: sermons, events, photos, service times and more.">
      <SimpleForm action={signIn} submitLabel="Sign in" pendingLabel="Signing in…">
        <TextField name="email" label="Email" type="email" autoComplete="username" inputMode="email" required />
        <TextField name="password" label="Password" type="password" autoComplete="current-password" required />
      </SimpleForm>
      <p className="mt-5 text-center text-[0.8125rem] leading-relaxed text-plum-950/55">
        Forgot your password? Ask your developer to run <code className="rounded bg-plum-100 px-1">npm run admin:reset-password</code> (see README).
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}
