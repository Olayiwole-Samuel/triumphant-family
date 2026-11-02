/**
 * Normalises stored content into the website's content types:
 *
 * - `null` values and blank strings become `undefined` (optional fields stay optional)
 * - objects with a missing `url` are dropped — e.g. an image whose upload was removed
 *
 * The cast to `T` is the trust boundary between storage and the UI; the
 * mappers in src/lib/content/index.ts are written to match src/types/content.ts.
 */
export function clean<T>(value: unknown): T {
  return cleanValue(value) as T;
}

function cleanValue(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map(cleanValue).filter((item) => item !== undefined);
  }

  if (typeof value === "object") {
    if ("url" in value && !(value as { url: unknown }).url) return undefined;

    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      const cleaned = cleanValue(entry);
      if (cleaned !== undefined) result[key] = cleaned;
    }
    return result;
  }

  return value;
}
