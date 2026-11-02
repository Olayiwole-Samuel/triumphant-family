import { defineConfig } from "drizzle-kit";

/** `npm run db:generate` turns changes in src/lib/db/schema.ts into SQL migrations in ./drizzle. */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
});
