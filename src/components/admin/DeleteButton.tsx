"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

/**
 * Two-step delete: the first tap asks "Tap again to delete", the second runs
 * the server action. (No browser pop-up, works the same on phones.)
 */
export function DeleteButton({
  action,
  label = "Delete",
  confirmLabel = "Tap again to delete permanently",
  className,
}: {
  action: () => Promise<unknown>;
  label?: string;
  confirmLabel?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!armed) return setArmed(true);
        startTransition(async () => {
          await action();
        });
      }}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:opacity-60",
        armed ? "bg-danger-600 text-white hover:bg-danger-700" : "text-danger-600 ring-1 ring-danger-200 hover:bg-danger-50",
        className,
      )}
      aria-live="polite"
    >
      <Icon name="trash" size={16} />
      {pending ? "Deleting…" : armed ? confirmLabel : label}
    </button>
  );
}
