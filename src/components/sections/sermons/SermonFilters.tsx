"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/States";
import {
  archiveHref,
  isFiltered,
  type ArchiveFacets,
  type ArchiveQuery,
  type MediaFilter,
} from "@/lib/sermons/archive";

const MEDIA_LABELS: Record<MediaFilter, string> = {
  video: "Video",
  audio: "Audio",
  both: "Video & audio",
};

const control =
  "h-12 w-full rounded-2xl border border-plum-200 bg-white px-4 text-[0.9375rem] text-plum-950 outline-none transition-[border-color,box-shadow] focus:border-plum-600 focus:ring-4 focus:ring-plum-600/15";

/**
 * Search, filters and sort for the archive. State lives in the URL
 * (shareable, back-button friendly, works without JavaScript as a GET form).
 * With JavaScript: dropdowns apply immediately, search applies on Enter or
 * the Search button — never on every keystroke.
 */
export function SermonFilters({ facets, query }: { facets: ArchiveFacets; query: ArchiveQuery }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const apply = () => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const value = (name: string) => {
      const v = String(data.get(name) ?? "").trim();
      return v || undefined;
    };
    const next: ArchiveQuery = {
      q: value("q") ?? "",
      speaker: value("speaker"),
      topic: value("topic"),
      year: value("year"),
      media: value("media") as MediaFilter | undefined,
      sort: value("sort") === "oldest" ? "oldest" : "newest",
      page: 1,
    };
    startTransition(() => router.push(`${archiveHref(next)}#results`, { scroll: false }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    apply();
  };

  const select = (name: keyof ArchiveQuery, label: string, options: { value: string; label: string }[], allLabel: string) =>
    options.length > 0 && (
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-plum-950/60">{label}</span>
        <select name={name} defaultValue={String(query[name] ?? "")} onChange={apply} className={control}>
          <option value="">{allLabel}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );

  return (
    <form
      ref={formRef}
      action="/sermons"
      method="get"
      role="search"
      aria-label="Search sermons"
      onSubmit={onSubmit}
      // Remount when the URL changes so the fields always reflect it.
      key={archiveHref(query)}
      className="squircle rounded-card bg-white p-5 shadow-card md:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search by title, speaker, topic or scripture</span>
          <Icon name="search" size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-plum-400" />
          <input
            type="search"
            name="q"
            defaultValue={query.q}
            maxLength={100}
            placeholder="Search by title, speaker, topic or scripture"
            className={`${control} pl-12`}
            enterKeyHint="search"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-plum-600 px-6 font-semibold text-white transition-[background-color,scale] hover:bg-plum-700 active:scale-95"
        >
          Search
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {select("speaker", "Speaker", facets.speakers.map((s) => ({ value: s, label: s })), "All speakers")}
        {select("topic", "Topic", facets.topics.map((t) => ({ value: t, label: t })), "All topics")}
        {select("year", "Year", facets.years.map((y) => ({ value: y, label: y })), "All years")}
        {select("media", "Media", facets.media.map((m) => ({ value: m, label: MEDIA_LABELS[m] })), "Any media")}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-plum-950/60">Sort</span>
          <select name="sort" defaultValue={query.sort} onChange={apply} className={control}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex min-h-6 flex-wrap items-center justify-between gap-3 text-sm">
        <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-plum-950/60">
          {pending && (
            <>
              <Spinner className="size-4" /> Updating results…
            </>
          )}
        </span>
        {isFiltered(query) && (
          <Link
            href="/sermons#results"
            scroll={false}
            className="inline-flex items-center gap-1.5 font-semibold text-plum-600 hover:underline"
          >
            <Icon name="close" size={14} /> Clear search & filters
          </Link>
        )}
      </div>
    </form>
  );
}
