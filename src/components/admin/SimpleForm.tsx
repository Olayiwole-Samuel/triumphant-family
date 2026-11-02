"use client";

import { useActionState, useMemo, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { IDLE, type FormAction } from "@/lib/admin/form-state";
import { submitWithoutReset } from "./AdminForm";
import { FormContext, useFormContext } from "./form-context";

/** A small form without the sticky save bar (sign-in, setup, account). */
export function SimpleForm({
  action,
  submitLabel,
  pendingLabel = "Please wait…",
  children,
}: {
  action: FormAction;
  submitLabel: string;
  pendingLabel?: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const context = useMemo(
    () => ({ errors: state.status === "error" ? state.errors : {}, pending, markDirty: () => {} }),
    [state, pending],
  );

  return (
    <FormContext.Provider value={context}>
      <form method="post" onSubmit={(event) => submitWithoutReset(event, formAction)} noValidate className="space-y-5">
        <div aria-live="polite">
          {state.status === "error" && (
            <p className="flex items-start gap-3 rounded-2xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 ring-1 ring-danger-200">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
              {state.message}
            </p>
          )}
          {state.status === "success" && (
            <p className="flex items-start gap-3 rounded-2xl bg-plum-100 px-4 py-3 text-sm font-medium text-plum-800">
              <Icon name="check" size={18} className="mt-0.5 shrink-0" />
              {state.message}
            </p>
          )}
        </div>
        {children}
        <Submit label={submitLabel} pendingLabel={pendingLabel} />
      </form>
    </FormContext.Provider>
  );
}

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormContext();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-plum-600 px-6 text-[0.9375rem] font-semibold text-white transition-[background-color,scale] hover:bg-plum-700 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
