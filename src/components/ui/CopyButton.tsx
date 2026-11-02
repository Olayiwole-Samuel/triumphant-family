"use client";

import { useRef, useState } from "react";
import { copyText } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils/cn";
import { Icon } from "./Icon";

type CopyButtonProps = {
  /** Text to copy. When empty, the button is disabled. */
  value?: string;
  label: string;
  className?: string;
};

type CopyState = "idle" | "copied" | "failed";

/**
 * Copies a value (e.g. an account number) and reports the real outcome —
 * it never claims success if the copy failed. The result is announced to
 * screen readers through a polite live region.
 */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);
  const text = value?.replace(/\s/g, "") ?? "";

  const copy = async () => {
    if (!text) return;
    const ok = await copyText(text);
    setState(ok ? "copied" : "failed");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), ok ? 2500 : 5000);
  };

  const message =
    state === "copied"
      ? "Copied to clipboard"
      : state === "failed"
        ? "Couldn’t copy automatically — please select and copy the number"
        : "";

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={copy}
        disabled={!text}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-[background-color,scale,opacity] duration-300 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45",
          className,
        )}
      >
        <Icon name={state === "copied" ? "check" : "copy"} size={16} />
        {state === "copied" ? "Copied" : label}
      </button>
      <span role="status" aria-live="polite" className={cn("text-xs", !message && "sr-only")}>
        {message}
      </span>
    </span>
  );
}
