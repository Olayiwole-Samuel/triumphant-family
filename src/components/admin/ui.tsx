import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

/** A white card grouping related fields, with a title and a short explanation. */
export function Card({
  title,
  description,
  children,
  className,
  id,
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("min-w-0 scroll-mt-24 rounded-[1.5rem] bg-white p-5 shadow-card ring-1 ring-plum-950/5 sm:p-7", className)}>
      {(title || description) && (
        <header className="mb-5">
          {title && <h2 className="text-lg font-bold tracking-tight text-plum-950">{title}</h2>}
          {description && <p className="mt-1 text-sm leading-relaxed text-plum-950/60">{description}</p>}
        </header>
      )}
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  back,
  actions,
  status,
}: {
  title: string;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <header className="mb-7">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-plum-600 hover:text-plum-800">
          <Icon name="chevronLeft" size={16} /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-plum-950 sm:text-[2rem]">{title}</h1>
            {status}
          </div>
          {description && <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-plum-950/60">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function StatusPill({ published, draftLabel = "Draft", liveLabel = "Published" }: { published: boolean; draftLabel?: string; liveLabel?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        published ? "bg-plum-600 text-white" : "bg-plum-100 text-plum-700",
      )}
    >
      <span className={cn("size-1.5 rounded-full", published ? "bg-white" : "bg-plum-400")} />
      {published ? liveLabel : draftLabel}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  icon,
  variant = "primary",
  external,
}: {
  href: string;
  children: ReactNode;
  icon?: IconName;
  variant?: "primary" | "secondary";
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors",
        variant === "primary" ? "bg-plum-600 text-white hover:bg-plum-700" : "bg-white text-plum-800 ring-1 ring-plum-950/10 hover:bg-plum-50",
      )}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
      {external && <span className="sr-only">(opens in a new tab)</span>}
    </Link>
  );
}

/** A list of items (sermons, events…) as tappable rows. */
export function ItemList({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-plum-950/6 overflow-hidden rounded-[1.5rem] bg-white shadow-card ring-1 ring-plum-950/5">{children}</ul>;
}

export function ItemRow({
  href,
  title,
  meta,
  status,
  thumb,
}: {
  href: string;
  title: string;
  meta?: ReactNode;
  status?: ReactNode;
  thumb?: ReactNode;
}) {
  return (
    <li>
      <Link href={href} className="flex min-h-16 items-center gap-4 px-4 py-3 transition-colors hover:bg-plum-50 sm:px-5">
        {thumb}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-plum-950">{title}</span>
          {meta && <span className="mt-0.5 block truncate text-sm text-plum-950/55">{meta}</span>}
        </span>
        {status}
        <Icon name="chevronRight" size={16} className="shrink-0 text-plum-950/30" />
      </Link>
    </li>
  );
}

export function EmptyNote({ icon, title, children, action }: { icon: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] bg-white px-6 py-12 text-center shadow-card ring-1 ring-plum-950/5">
      <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-plum-100 text-plum-700">
        <Icon name={icon} size={22} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-plum-950">{title}</h2>
      {children && <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-plum-950/60">{children}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm leading-relaxed",
        tone === "warning" ? "bg-danger-50 text-danger-700 ring-1 ring-danger-200" : "bg-plum-100 text-plum-800",
      )}
    >
      <Icon name={tone === "warning" ? "alert" : "check"} size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
