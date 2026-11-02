import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";

/**
 * Shared empty / loading states, so missing content always looks deliberate.
 * (The error state lives in ErrorState.tsx because it is a Client Component.)
 */

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon = "calendar", action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "squircle flex flex-col items-start gap-5 rounded-card bg-current/[0.04] p-8 md:flex-row md:items-center md:gap-8 md:p-10",
        className,
      )}
    >
      <span className="squircle grid size-14 shrink-0 place-items-center rounded-2xl bg-current/[0.06]">
        <Icon name={icon} size={24} />
      </span>
      <div className="flex-1">
        <p className="text-xl font-semibold tracking-tight">{title}</p>
        {description && <p className="mt-1.5 max-w-xl opacity-70">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** iOS-style activity indicator. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-8 animate-[spin_1s_steps(8)_infinite] motion-reduce:animate-none", className)}
    >
      {Array.from({ length: 8 }, (_, index) => (
        <rect
          key={index}
          x="11"
          y="2"
          width="2"
          height="6"
          rx="1"
          fill="currentColor"
          opacity={(index + 1) / 8}
          transform={`rotate(${index * 45} 12 12)`}
        />
      ))}
    </svg>
  );
}

export function LoadingState({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-4 py-24", className)}
    >
      <Spinner />
      <span className="text-sm font-medium opacity-70">{label}…</span>
    </div>
  );
}

/** Placeholder blocks that mimic content while it streams in. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-current/10 motion-reduce:animate-none", className)}
    />
  );
}
