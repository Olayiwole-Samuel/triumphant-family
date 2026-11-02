#!/usr/bin/env node
/**
 * Runs a command with a ready, up-to-date database.
 *
 *   node scripts/with-db.mjs next dev        (what `npm run dev` does)
 *   node scripts/with-db.mjs                 (just apply migrations)
 *
 * - DATABASE_URL set (environment, .env.local or .env) → that database (e.g. Neon)
 *   is migrated, then the command runs.
 * - No DATABASE_URL → a local database is started on this computer (PGlite,
 *   stored in .data/pglite — nothing to install), migrated, and its address
 *   is passed to the command. If another terminal already started it, that
 *   one is reused.
 *
 * Migrations live in ./drizzle (create them with `npm run db:generate`).
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const LOCAL_PORT = Number(process.env.LOCAL_DB_PORT || 54329);
const LOCAL_URL = `postgres://postgres:postgres@127.0.0.1:${LOCAL_PORT}/postgres?sslmode=disable`;
const MIGRATIONS = path.join(root, "drizzle");

/** Reads DATABASE_URL the same way Next.js does (process env first, then .env.local, then .env). */
function configuredDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const file of [".env.local", ".env"]) {
    const full = path.join(root, file);
    if (!existsSync(full)) continue;
    // [ \t]* (not \s*) so an empty value never runs on to the next line.
    const match = readFileSync(full, "utf8").match(/^[ \t]*DATABASE_URL[ \t]*=[ \t]*(.*)$/m);
    const value = match?.[1]?.trim().replace(/^["']|["']$/g, "");
    if (value) return value;
  }
  return undefined;
}

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

async function startLocalDatabase() {
  const { PGlite } = await import("@electric-sql/pglite");
  const { PGLiteSocketServer } = await import("@electric-sql/pglite-socket");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");

  const dataDir = path.join(root, ".data", "pglite");
  mkdirSync(dataDir, { recursive: true });
  const db = await PGlite.create(dataDir);
  await migrate(drizzle(db), { migrationsFolder: MIGRATIONS });

  const server = new PGLiteSocketServer({ db, port: LOCAL_PORT, host: "127.0.0.1", maxConnections: 32 });
  await server.start();
  console.log(`[db] Local database ready (.data/pglite, port ${LOCAL_PORT})`);
  return {
    async stop() {
      await server.stop().catch(() => {});
      await db.close().catch(() => {});
    },
  };
}

async function migrateRemote(url) {
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS });
    console.log("[db] Database is up to date");
  } finally {
    await client.end({ timeout: 5 });
  }
}

let local;
let databaseUrl = configuredDatabaseUrl();

if (databaseUrl) {
  await migrateRemote(databaseUrl);
} else if (await portInUse(LOCAL_PORT)) {
  // Another `npm run dev` already runs the local database — share it.
  databaseUrl = LOCAL_URL;
  await migrateRemote(databaseUrl);
} else {
  local = await startLocalDatabase();
  databaseUrl = LOCAL_URL;
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  await local?.stop();
  process.exit(0);
}

const env = { ...process.env, DATABASE_URL: databaseUrl };
const child =
  command === "next" || command === "node"
    ? spawn(process.execPath, command === "next" ? [require.resolve("next/dist/bin/next"), ...args] : args, {
        stdio: "inherit",
        env,
      })
    : spawn([command, ...args].join(" "), { stdio: "inherit", shell: true, env });

let stopping = false;
async function shutdown(code) {
  if (stopping) return;
  stopping = true;
  await local?.stop();
  process.exit(code ?? 0);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}
child.on("exit", (code) => shutdown(code));
