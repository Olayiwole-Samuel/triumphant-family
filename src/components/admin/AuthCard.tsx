import type { ReactNode } from "react";
import { Gleam } from "@/components/ui/Gleam";

/** Centered card used by the sign-in and setup screens. */
export function AuthCard({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-plum-700">
          <Gleam className="size-5" />
          <span className="text-sm font-semibold">The Triumphant Family · Admin</span>
        </div>
        <div className="rounded-[1.75rem] bg-white p-6 shadow-card ring-1 ring-plum-950/5 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-plum-950">{title}</h1>
          {description && <p className="mt-2 text-[0.9375rem] leading-relaxed text-plum-950/60">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
