"use server";

import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { FormReader, failure, success, type FormState } from "@/lib/admin/form";
import { hashPassword, passwordProblems, verifyPassword } from "@/lib/admin/password";
import {
  adminExists,
  clearFailedAttempts,
  createSession,
  destroyOtherSessions,
  destroySession,
  recordFailedAttempt,
  requireAdmin,
  setupCodeRequired,
  tooManyFailedAttempts,
} from "@/lib/admin/session";
import { getDb, schema } from "@/lib/db";

/* A fixed hash used to keep sign-in timing the same when the email is unknown. */
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function signIn(_state: FormState, data: FormData): Promise<FormState> {
  if (await tooManyFailedAttempts()) {
    return failure("Too many sign-in attempts. Please wait 15 minutes and try again.");
  }
  const form = new FormReader(data);
  const email = form.raw("email").trim().toLowerCase();
  const password = form.raw("password");
  if (!email || !password) return failure("Enter your email and password.");

  const [user] = await getDb()
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email))
    .limit(1);
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    await recordFailedAttempt();
    return failure("That email and password don't match. Please try again.");
  }

  await clearFailedAttempts();
  await createSession(user.id);
  redirect("/admin");
}

export async function signOut() {
  await destroySession();
  redirect("/admin/login");
}

function codesMatch(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Creates the one admin account — only while no account exists yet. */
export async function createFirstAdmin(_state: FormState, data: FormData): Promise<FormState> {
  if (await adminExists()) redirect("/admin/login");

  const form = new FormReader(data);
  if (setupCodeRequired()) {
    const expected = process.env.ADMIN_SETUP_CODE;
    if (!expected) return failure("Setup is locked: ADMIN_SETUP_CODE isn't set on the server (see README → Admin).");
    if (!codesMatch(form.raw("setupCode").trim(), expected)) {
      await recordFailedAttempt();
      form.error("setupCode", "That setup code isn't correct.");
    }
  }
  if (await tooManyFailedAttempts()) return failure("Too many attempts. Please wait 15 minutes and try again.");

  const email = form.email("email", { label: "Email", required: true });
  const password = form.raw("password");
  const problem = passwordProblems(password);
  if (problem) form.error("password", problem);
  if (password !== form.raw("confirm")) form.error("confirm", "The two passwords don't match.");
  if (!form.ok || !email) return form.fail();

  const [user] = await getDb()
    .insert(schema.adminUsers)
    .values({ email, passwordHash: await hashPassword(password) })
    .returning({ id: schema.adminUsers.id });
  await createSession(user.id);
  redirect("/admin");
}

export async function changePassword(_state: FormState, data: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const form = new FormReader(data);
  const current = form.raw("current");
  const next = form.raw("password");

  const [user] = await getDb().select().from(schema.adminUsers).where(eq(schema.adminUsers.id, admin.id)).limit(1);
  if (!user || !(await verifyPassword(current, user.passwordHash))) form.error("current", "Your current password isn't correct.");
  const problem = passwordProblems(next);
  if (problem) form.error("password", problem);
  if (next !== form.raw("confirm")) form.error("confirm", "The two new passwords don't match.");
  if (!form.ok) return form.fail();

  await getDb()
    .update(schema.adminUsers)
    .set({ passwordHash: await hashPassword(next) })
    .where(eq(schema.adminUsers.id, admin.id));
  await destroyOtherSessions(admin.id);
  return success("Password changed. Any other devices have been signed out.");
}

export async function changeEmail(_state: FormState, data: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const form = new FormReader(data);
  const email = form.email("email", { label: "Email", required: true });
  const [user] = await getDb().select().from(schema.adminUsers).where(eq(schema.adminUsers.id, admin.id)).limit(1);
  if (!user || !(await verifyPassword(form.raw("current"), user.passwordHash))) {
    form.error("current", "Your password isn't correct.");
  }
  if (!form.ok || !email) return form.fail();
  await getDb().update(schema.adminUsers).set({ email }).where(eq(schema.adminUsers.id, admin.id));
  return success("Sign-in email updated.");
}
