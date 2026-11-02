"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/States";
import {
  FORMAT_LABELS,
  defaultSort,
  eventsHref,
  isEventFiltered,
  type EventFacets,
  type EventQuery,
  type EventSort,
} from "@/lib/events/archive";
import { cn } from "@/lib/utils/cn";
import type { EventFormat } from "@/types/content";

const control =
  "h-11 w-full rounded-2xl border border-plum-200 bg-white px-3.5 text-[0.9375rem] text-plum-950 outline-none transition-[border-color,box-shadow] focus:border-plum-600 focus:ring-4 focus:ring-plum-600/15";

/**
 * Upcoming / Past tabs + search, category, format and sort. State lives in
 * the URL (shareable; back/forward works; also works as a plain GET form
 * without JavaScript). Dropdowns apply at once; search applies on submit.
 */
export function EventFilters({
  facets,
  query,
  counts,
}: {
  facets: EventFacets;
  query: EventQuery;
  counts: { upcoming: number; past: number };
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const go = (href: string) => startTransition(() => router.push(`${href}#events`, { scroll: false }));

  const apply = () => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "").trim() || undefined;
    const sort = value("sort") as EventSort | undefined;
    go(
      eventsHref({
        q: value("q") ?? "",
        when: query.when,
        category: value("category"),
        format: value("format") as EventFormat | undefined,
        sort: sort ?? defaultSort(query.when),
        page: 1,
      }),
    );
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    apply();
  };

  const tab = (when: EventQuery["when"], label: string, count: number) => {
    const active = query.when === when;
    return (
      <Link
        href={`${eventsHref({ ...query, when, sort: defaultSort(when), page: 1 })}#events`}
        scroll={false}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors sm:flex-none",
          active ? "bg-plum-600 text-white shadow-card" : "text-plum-950/70 hover:bg-plum-100 hover:text-plum-950",
        )}
      >
        {label}
        <span className={cn("rounded-full px-2 py-0.5 text-xs tabular-nums", active ? "bg-white/20" : "bg-plum-100")}>{count}</span>
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      <nav aria-label="Upcoming or past events" className="inline-flex w-full gap-1 rounded-full bg-white p-1 shadow-card sm:w-auto">
        {tab("upcoming", "Upcoming", counts.upcoming)}
        {tab("past", "Past", counts.past)}
      </nav>

      <form
        ref={formRef}
        action="/events"
        method="get"
        role="search"
        aria-label="Search events"
        onSubmit={onSubmit}
        key={eventsHref(query)}
        className="squircle rounded-card bg-white p-4 shadow-card md:p-5"
      >
        {query.when === "past" && <input type="hidden" name="when" value="past" />}
        <div className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Search events by name, description, venue or category</span>
            <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-plum-400" />
            <input
              type="search"
              name="q"
              defaultValue={query.q}
              maxLength={100}
              placeholder="Search events"
              enterKeyHint="search"
              className={`${control} pl-10`}
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center rounded-full bg-plum-600 px-5 text-sm font-semibold text-white transition-[background-color,scale] hover:bg-plum-700 active:scale-95"
          >
            Search
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {facets.categories.length > 0 && (
            <label className="block">
              <span className="sr-only">Category</span>
              <select name="category" defaultValue={query.category ?? ""} onChange={apply} className={control}>
                <option value="">All categories</option>
                {facets.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          )}
          {facets.formats.length > 0 && (
            <label className="block">
              <span className="sr-only">Format</span>
              <select name="format" defaultValue={query.format ?? ""} onChange={apply} className={control}>
                <option value="">Any format</option>
                {facets.formats.map((format) => (
                  <option key={format} value={format}>
                    {FORMAT_LABELS[format]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="sr-only">Sort</span>
            <select name="sort" defaultValue={query.sort} onChange={apply} className={control}>
              {query.when === "past" ? (
                <option value="latest">Most recent first</option>
              ) : (
                <option value="soonest">Soonest first</option>
              )}
              <option value={query.when === "past" ? "soonest" : "latest"}>
                {query.when === "past" ? "Oldest first" : "Latest first"}
              </option>
              <option value="az">A–Z</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-3 text-sm">
          <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-plum-950/60">
            {pending && (
              <>
                <Spinner className="size-4" /> Updating…
              </>
            )}
          </span>
          {isEventFiltered(query) && (
            <Link
              href={`${eventsHref({ ...query, q: "", category: undefined, format: undefined, page: 1 })}#events`}
              scroll={false}
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-plum-600 hover:underline"
            >
              <Icon name="close" size={14} /> Clear search & filters
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
