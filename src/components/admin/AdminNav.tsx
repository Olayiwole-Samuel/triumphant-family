"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { GleamTile } from "@/components/ui/Gleam";
import { cn } from "@/lib/utils/cn";

type NavItem = { href: string; label: string; icon: IconName };

const GROUPS: Array<{ title?: string; items: NavItem[] }> = [
  { items: [{ href: "/admin", label: "Dashboard", icon: "home" }] },
  {
    title: "Content",
    items: [
      { href: "/admin/sermons", label: "Sermons", icon: "mic" },
      { href: "/admin/events", label: "Events", icon: "calendar" },
      { href: "/admin/gallery", label: "Photo gallery", icon: "image" },
      { href: "/admin/services", label: "Service times", icon: "clock" },
      { href: "/admin/leaders", label: "Leadership", icon: "users" },
    ],
  },
  {
    title: "Pages",
    items: [
      { href: "/admin/church", label: "Church information", icon: "settings" },
      { href: "/admin/pages/home", label: "Home page", icon: "file" },
      { href: "/admin/pages/about", label: "About page", icon: "file" },
      { href: "/admin/pages/watch", label: "Watch page", icon: "play" },
      { href: "/admin/pages/events", label: "Events page", icon: "file" },
      { href: "/admin/pages/giving", label: "Giving", icon: "bank" },
    ],
  },
  { title: "You", items: [{ href: "/admin/account", label: "Account & password", icon: "lock" }] },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="space-y-6">
      {GROUPS.map((group, index) => (
        <div key={group.title ?? index}>
          {group.title && <p className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-plum-950/45 uppercase">{group.title}</p>}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-medium transition-colors",
                      active ? "bg-plum-600 text-white" : "text-plum-950/80 hover:bg-plum-100",
                    )}
                  >
                    <Icon name={item.icon} size={18} className={active ? "text-white" : "text-plum-500"} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Footer({ email, signOut }: { email: string; signOut: () => Promise<void> }) {
  return (
    <div className="space-y-2 border-t border-plum-950/8 pt-4">
      <Link
        href="/"
        target="_blank"
        className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-medium text-plum-950/80 hover:bg-plum-100"
      >
        <Icon name="external" size={18} className="text-plum-500" /> View website
        <span className="sr-only">(opens in a new tab)</span>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.9375rem] font-medium text-plum-950/80 hover:bg-plum-100"
        >
          <Icon name="logout" size={18} className="text-plum-500" /> Sign out
        </button>
      </form>
      <p className="truncate px-3 text-xs text-plum-950/45">Signed in as {email}</p>
    </div>
  );
}

/** Sidebar on large screens; a top bar with a slide-in menu on phones. */
export function AdminNav({ email, signOut }: { email: string; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [open]);

  const brand = (
    <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
      <GleamTile className="size-9" />
      <span className="leading-tight">
        <span className="block text-sm font-bold text-plum-950">The Triumphant Family</span>
        <span className="block text-xs text-plum-950/55">Website admin</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-plum-950/8 bg-white/80 px-4 py-5 backdrop-blur-xl lg:flex">
        <div className="px-2">{brand}</div>
        <div className="mt-7 flex-1 overflow-y-auto pb-6">
          <NavLinks pathname={pathname} />
        </div>
        <Footer email={email} signOut={signOut} />
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-plum-950/8 bg-white/85 px-4 backdrop-blur-xl lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="admin-menu"
          className="inline-flex size-11 items-center justify-center rounded-full bg-plum-100 text-plum-800"
        >
          <Icon name="menu" size={20} />
          <span className="sr-only">Open menu</span>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" id="admin-menu" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-plum-950/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col bg-white px-4 py-5 shadow-float">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-plum-950/60">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-11 items-center justify-center rounded-full bg-plum-100 text-plum-800"
                autoFocus
              >
                <Icon name="close" size={20} />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto pb-6">
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <Footer email={email} signOut={signOut} />
          </div>
        </div>
      )}
    </>
  );
}
