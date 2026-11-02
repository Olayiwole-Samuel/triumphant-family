import "server-only";
import { and, eq, ne } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db";

/** "Sunday Worship — 12 Oct!" → "sunday-worship-12-oct" (accents removed, max 80 chars). */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Web addresses reserved by the site's own routes. */
const RESERVED = new Set(["new", "admin", "api"]);

/**
 * A free web address for an item: the requested one, or "-2", "-3"… appended
 * when another item already uses it.
 */
export async function uniqueSlug(
  table: PgTable & { id: PgColumn; slug: PgColumn },
  wanted: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(wanted) || "item";
  for (let attempt = 1; attempt < 200; attempt++) {
    const candidate = attempt === 1 && !RESERVED.has(base) && !base.startsWith("yt-") ? base : `${base}-${attempt}`;
    const [taken] = await getDb()
      .select({ id: table.id })
      .from(table)
      .where(excludeId ? and(eq(table.slug, candidate), ne(table.id, excludeId)) : eq(table.slug, candidate))
      .limit(1);
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}
