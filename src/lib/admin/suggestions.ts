import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

/**
 * Earlier values offered as suggestions while typing (so editors reuse the
 * same spelling — filters and "related" lists depend on it).
 */

async function distinct(query: ReturnType<typeof sql>): Promise<string[]> {
  const rows = (await getDb().execute(query)) as unknown as Array<{ value: string | null }>;
  return rows
    .map((row) => row.value?.trim())
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b));
}

export const sermonSuggestions = async () => {
  const [speakers, series, topics] = await Promise.all([
    distinct(sql`select distinct speaker as value from sermons where speaker is not null limit 200`),
    distinct(sql`select distinct series as value from sermons where series is not null limit 200`),
    distinct(sql`select distinct jsonb_array_elements_text(topics) as value from sermons limit 300`),
  ]);
  return { speakers, series, topics };
};

export const eventSuggestions = async () => {
  const [categories, series, venues] = await Promise.all([
    distinct(sql`select distinct category as value from events where category is not null limit 200`),
    distinct(sql`select distinct series as value from events where series is not null limit 200`),
    distinct(sql`select distinct location as value from events where location is not null limit 200`),
  ]);
  return { categories, series, venues };
};

export const albumCategories = () =>
  distinct(sql`select distinct category as value from gallery_albums where category is not null limit 200`);
