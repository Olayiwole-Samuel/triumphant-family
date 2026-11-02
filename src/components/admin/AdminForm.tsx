"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Icon } from "@/components/ui/Icon";
import { IDLE, type FormAction } from "@/lib/admin/form-state";
import { cn } from "@/lib/utils/cn";
import { FormContext, useFormContext } from "./form-context";

type AdminFormProps = {
  action: FormAction;
  children: ReactNode;
  /** Buttons in the save bar. Defaults to a single "Save changes" button. */
  buttons?: ReactNode;
  /** Shown in the save bar when nothing has changed yet. */
  idleHint?: string;
  className?: string;
};

/**
 * Every admin edit screen is one of these: fields + a sticky save bar.
 *
 * - Saves through a server action; field errors appear under each field and
 *   the first one is focused.
 * - Warns before leaving the page with unsaved changes.
 * - Submits manually (not via `<form action>`), because React clears form
 *   fields after an action — which would wipe what was typed when a save fails.
 */
export function AdminForm({ action, children, buttons, idleHint, className }: AdminFormProps) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const markDirty = useCallback(() => setDirty(true), []);

  // After a save: clear "unsaved" on success, focus the first problem on error.
  const [handledAt, setHandledAt] = useState(0);
  if (state.status !== "idle" && state.at !== handledAt) {
    setHandledAt(state.at);
    if (state.status === "success") setDirty(false);
  }
  useEffect(() => {
    if (state.status !== "error") return;
    const invalid = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalid='true']");
    (invalid ?? document.getElementById("form-status"))?.focus();
  }, [state]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const context = useMemo(
    () => ({ errors: state.status === "error" ? state.errors : {}, pending, markDirty }),
    [state, pending, markDirty],
  );

  return (
    <FormContext.Provider value={context}>
      <form
        ref={formRef}
        method="post"
        onSubmit={(event) => submitWithoutReset(event, formAction)}
        onInput={markDirty}
        onChange={markDirty}
        noValidate
        className={cn("pb-28", className)}
      >
        <div id="form-status" tabIndex={-1} aria-live="polite" className="outline-none">
          {state.status === "error" && (
            <p className="mb-6 flex items-start gap-3 rounded-2xl bg-danger-50 px-4 py-3.5 text-sm font-medium text-danger-700 ring-1 ring-danger-200">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
              {state.message}
            </p>
          )}
          {state.status === "success" && !dirty && (
            <p className="mb-6 flex items-start gap-3 rounded-2xl bg-plum-100 px-4 py-3.5 text-sm font-medium text-plum-800">
              <Icon name="check" size={18} className="mt-0.5 shrink-0" />
              {state.message}
            </p>
          )}
        </div>

        <div className="space-y-6">{children}</div>

        <div className="fixed inset-x-0 bottom-0 z-30 lg:left-72">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 border-t border-plum-950/8 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-8">
            <p className="min-w-0 truncate text-sm text-plum-950/60">
              {pending
                ? "Saving…"
                : dirty
                  ? "You have unsaved changes"
                  : state.status === "success"
                    ? "All changes saved"
                    : (idleHint ?? "")}
            </p>
            <div className="flex shrink-0 items-center gap-2">{buttons ?? <SubmitButton>Save changes</SubmitButton>}</div>
          </div>
        </div>
      </form>
    </FormContext.Provider>
  );
}

type SubmitButtonProps = {
  children: ReactNode;
  /** Sent as `intent` — e.g. "publish" or "draft". */
  intent?: string;
  variant?: "primary" | "secondary";
};

/** Sends the form (including which button was pressed) without React's automatic reset. */
export function submitWithoutReset(event: FormEvent<HTMLFormElement>, formAction: (data: FormData) => void) {
  event.preventDefault();
  const submitter = (event.nativeEvent as SubmitEvent).submitter;
  const data = new FormData(event.currentTarget, submitter instanceof HTMLButtonElement ? submitter : undefined);
  startTransition(() => formAction(data));
}

export function SubmitButton({ children, intent, variant = "primary" }: SubmitButtonProps) {
  const { pending: busy } = useFormContext();
  return (
    <button
      type="submit"
      name={intent ? "intent" : undefined}
      value={intent}
      disabled={busy}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-[background-color,scale,opacity] active:scale-[0.97] disabled:opacity-60",
        variant === "primary"
          ? "bg-plum-600 text-white hover:bg-plum-700"
          : "bg-plum-100 text-plum-800 hover:bg-plum-200",
      )}
    >
      {children}
    </button>
  );
}
