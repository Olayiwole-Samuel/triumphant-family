import "server-only";
import { updateTag } from "next/cache";

/**
 * After a save: expire the cached public pages that show this content, so the
 * change appears immediately (tags match src/lib/content/index.ts).
 */
export function refreshPublic(...tags: string[]) {
  for (const tag of new Set(tags)) updateTag(tag);
}
