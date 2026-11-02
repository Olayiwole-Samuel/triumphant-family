import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * The database connection (Postgres via postgres.js + Drizzle).
 *
 * DATABASE_URL is provided by `scripts/with-db.mjs`: either your hosted
 * database (Neon) or the local database it starts for development.
 * One connection pool per server process, kept across hot reloads.
 */

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __tfamDb?: { url: string; db: Database } };

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

/** True for the local development database started by scripts/with-db.mjs. */
export function isLocalDatabaseUrl(url = process.env.DATABASE_URL ?? "") {
  return /@(127\.0\.0\.1|localhost)[:/]/.test(url);
}

/**
 * Neon's copied connection strings end with `channel_binding=require`, which
 * the postgres.js driver doesn't support (the connection is still TLS-encrypted
 * via sslmode=require). Removing it lets the string be pasted exactly as copied.
 */
export function withoutChannelBinding(url: string) {
  return url.replace(/([?&])channel_binding=[^&]*(&|$)/, (_match, before: string, after: string) => (after ? before : "")).replace(/[?&]$/, "");
}

export function getDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Start the site with `npm run dev` (it sets up a local database), or add DATABASE_URL.",
    );
  }
  if (globalForDb.__tfamDb?.url === url) return globalForDb.__tfamDb.db;

  const local = isLocalDatabaseUrl(url);
  const client = postgres(withoutChannelBinding(url), {
    // Works with poolers (Neon's pooled URL) and the local development server.
    prepare: false,
    // The local development database (PGlite) is reliable with one connection
    // per process (queries are pipelined over it); hosted Postgres gets a pool.
    max: local ? 1 : 5,
    idle_timeout: 20,
    connect_timeout: 15,
    onnotice: () => {},
  });
  const db = drizzle(client, { schema });
  globalForDb.__tfamDb = { url, db };
  return db;
}

export { schema };
