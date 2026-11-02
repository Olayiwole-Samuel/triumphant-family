"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/States";
import { cn } from "@/lib/utils/cn";

function PendingHint() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className="absolute -top-1 -right-1 size-4 text-plum-600" /> : null;
}

function PageLink({
  href,
  anchor,
  children,
  label,
  current = false,
}: {
  href: string;
  anchor: string;
  children: ReactNode;
  label: string;
  current?: boolean;
}) {
  return (
    <Link
      href={`${href}#${anchor}`}
      scroll={false}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={cn(
        "relative grid h-11 min-w-11 place-items-center rounded-full px-3 text-sm font-semibold transition-colors",
        current ? "bg-plum-600 text-white" : "bg-white text-plum-950 shadow-card hover:bg-plum-100",
      )}
    >
      {children}
      <PendingHint />
    </Link>
  );
}

/**
 * Pages as links that keep the current search & filters (state lives in the
 * URL). `hrefs[i]` is the link to page i + 1, built on the server.
 */
export function Pagination({
  hrefs,
  page,
  label,
  anchor = "results",
}: {
  hrefs: string[];
  page: number;
  label: string;
  /** Element id to land on after changing page. */
  anchor?: string;
}) {
  const pageCount = hrefs.length;
  if (pageCount <= 1) return null;
  const href = (p: number) => hrefs[p - 1];

  // Show first, last, current ±1, with gaps.
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );

  return (
    <nav aria-label={label} className="mt-14 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <PageLink anchor={anchor} href={href(page - 1)} label="Previous page">
          <Icon name="chevronLeft" size={18} />
        </PageLink>
      )}
      {pages.map((p, index) => (
        <span key={p} className="flex items-center gap-2">
          {index > 0 && p - pages[index - 1] > 1 && (
            <span aria-hidden="true" className="px-1 text-plum-950/40">
              …
            </span>
          )}
          <PageLink anchor={anchor} href={href(p)} label={`Page ${p}`} current={p === page}>
            {p}
          </PageLink>
        </span>
      ))}
      {page < pageCount && (
        <PageLink anchor={anchor} href={href(page + 1)} label="Next page">
          <Icon name="chevronRight" size={18} />
        </PageLink>
      )}
    </nav>
  );
}
