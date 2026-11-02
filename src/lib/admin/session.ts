import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, lt, ne } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { getDb, isLocalDatabaseUrl, schema } from "@/lib/db";

/**
 * Admin sign-in sessions.
 *
 * The browser keeps a random token in an http-only cookie; the database keeps
 * only its SHA-256 hash, so a database leak can't be used to sign in. Sessions
 * last 30 days and are deleted on sign-out or password change.
 */

export const SESSION_COOKIE = "tfam_admin";
const SESSION_DAYS = 30;

/** Sign-in attempts allowed per device/network in the window below. */
const MAX_FAILED_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

const sha256 = (value: string) => createHash("sha256").update(value).digest("base64url");

export type AdminUser = { id: number; email: string };

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const db = getDb();
  await db.insert(schema.adminSessions).values({ id: sha256(token), userId, expiresAt });
  // Tidy up expired sessions while we're here.
  await db.delete(schema.adminSessions).where(lt(schema.adminSessions.expiresAt, new Date()));

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !isLocalDatabaseUrl(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** The signed-in admin for this request, or null. */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  await connection(); // always checked per request
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const [row] = await getDb()
      .select({ id: schema.adminUsers.id, email: schema.adminUsers.email })
      .from(schema.adminSessions)
      .innerJoin(schema.adminUsers, eq(schema.adminSessions.userId, schema.adminUsers.id))
      .where(and(eq(schema.adminSessions.id, sha256(token)), gt(schema.adminSessions.expiresAt, new Date())))
      .limit(1);
    return row ?? null;
  } catch (error) {
    console.error("[admin] Could not check the session:", error instanceof Error ? error.message : error);
    return null;
  }
});

/** For admin pages and server actions: the admin, or a redirect to the sign-in page. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await getDb().delete(schema.adminSessions).where(eq(schema.adminSessions.id, sha256(token)));
  store.delete(SESSION_COOKIE);
}

/** Signs out every other device (after a password change). */
export async function destroyOtherSessions(userId: number) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const sessions = schema.adminSessions;
  await getDb()
    .delete(sessions)
    .where(token ? and(eq(sessions.userId, userId), ne(sessions.id, sha256(token))) : eq(sessions.userId, userId));
}

/* --------------------------------------------------------- Rate limiting */

/** A hashed key for the client's network address (raw addresses are never stored). */
async function clientKey() {
  const list = await headers();
  const address =
    list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "local";
  return sha256(`tfam-login:${address}`);
}

export async function tooManyFailedAttempts(): Promise<boolean> {
  const key = await clientKey();
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS);
  const [row] = await getDb()
    .select({ total: count() })
    .from(schema.loginAttempts)
    .where(and(eq(schema.loginAttempts.clientKey, key), gt(schema.loginAttempts.attemptedAt, since)));
  return (row?.total ?? 0) >= MAX_FAILED_ATTEMPTS;
}

export async function recordFailedAttempt() {
  const db = getDb();
  await db.insert(schema.loginAttempts).values({ clientKey: await clientKey() });
  await db.delete(schema.loginAttempts).where(lt(schema.loginAttempts.attemptedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}

export async function clearFailedAttempts() {
  await getDb().delete(schema.loginAttempts).where(eq(schema.loginAttempts.clientKey, await clientKey()));
}

/* ------------------------------------------------------------------ Setup */

export async function adminExists(): Promise<boolean> {
  const [row] = await getDb().select({ total: count() }).from(schema.adminUsers);
  return (row?.total ?? 0) > 0;
}

/**
 * Creating the first admin account is allowed only while none exists — and,
 * on the live site, only with the ADMIN_SETUP_CODE from the server settings,
 * so a stranger can't claim the admin before you do.
 */
export function setupCodeRequired(): boolean {
  const local = isLocalDatabaseUrl();
  return process.env.NODE_ENV === "production" && !local;
}
