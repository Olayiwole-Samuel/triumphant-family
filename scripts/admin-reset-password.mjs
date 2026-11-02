#!/usr/bin/env node
/**
 * Forgot the admin password? Run:
 *
 *   npm run admin:reset-password
 *
 * Sets a new temporary password for the admin account, signs out every
 * device, and prints the temporary password ONCE. Sign in with it, then
 * choose your own password under Admin → Account & password.
 *
 * Works on your computer (local database) and, with DATABASE_URL set to the
 * live database, for the live site. Run it while `npm run dev` is stopped.
 *
 * Options:  --email you@example.com   also change the sign-in email
 */
import { randomBytes, randomInt, scrypt } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postgres = require("postgres");

const WORDS = [
  "river", "lantern", "morning", "harvest", "cedar", "anchor", "meadow", "silver", "candle", "valley",
  "shepherd", "olive", "garden", "mountain", "harbor", "willow", "summit", "bright", "gentle", "faithful",
];

const emailArg = process.argv.indexOf("--email");
const newEmail = emailArg > -1 ? process.argv[emailArg + 1]?.trim().toLowerCase() : undefined;
if (emailArg > -1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail ?? "")) {
  console.error("Please give a valid email after --email.");
  process.exit(1);
}

function hash(password) {
  const salt = randomBytes(16);
  const params = { N: 16384, r: 8, p: 1 };
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, 64, { ...params, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error
        ? reject(error)
        : resolve(["scrypt", params.N, params.r, params.p, salt.toString("base64"), key.toString("base64")].join("$")),
    ),
  );
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });
try {
  const users = await sql`select id, email from admin_users order by id limit 2`;
  if (!users.length) {
    console.log("\nThere is no admin account yet. Start the site and open /admin/setup to create one.\n");
  } else {
    const user = users[0];
    const password = [0, 1, 2, 3].map(() => WORDS[randomInt(WORDS.length)]).join("-") + "-" + randomInt(10, 100);
    await sql`update admin_users set password_hash = ${await hash(password)}, email = ${newEmail ?? user.email}, updated_at = now() where id = ${user.id}`;
    await sql`delete from admin_sessions where user_id = ${user.id}`;
    console.log(`
Admin password reset. Every device has been signed out.

  Email:               ${newEmail ?? user.email}
  Temporary password:  ${password}

Sign in at /admin, then choose your own password under "Account & password".
`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
