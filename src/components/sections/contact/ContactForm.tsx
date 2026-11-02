"use client";

import { useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/States";
import {
  CONTACT_LIMITS,
  normalizeContactInput,
  validateContactInput,
  type ContactErrors,
  type ContactField,
  type ContactInput,
  type ContactResponse,
} from "@/lib/contact/validation";
import { cn } from "@/lib/utils/cn";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success" }
  | { state: "error"; message: string };

const EMPTY: ContactInput = { name: "", email: "", subject: "", message: "" };
const FIELD_ORDER: ContactField[] = ["name", "email", "subject", "message"];

const inputClass =
  "w-full rounded-2xl border border-plum-200 bg-white px-4 py-3.5 text-base text-plum-950 placeholder:text-plum-950/35 transition-[border-color,box-shadow] duration-200 outline-none focus:border-plum-600 focus:ring-4 focus:ring-plum-600/15 aria-[invalid=true]:border-plum-700 aria-[invalid=true]:bg-plum-50";

/**
 * Contact form. Validates in the browser for instant feedback; the server
 * validates again and is the source of truth. Success is only shown when the
 * server confirms the email was handed to Resend.
 */
export function ContactForm() {
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const startedAt = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const submitting = status.state === "submitting";

  /** Records when the visitor first started filling in the form (for the anti-bot timing check). */
  const markStarted = (event: FocusEvent<HTMLFormElement>) => {
    if (startedAt.current === null) {
      startedAt.current = Math.round(performance.timeOrigin + event.timeStamp);
    }
  };

  const update = (field: ContactField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const focusFirstError = (fieldErrors: ContactErrors) => {
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const input = normalizeContactInput(values);
    const fieldErrors = validateContactInput(input);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      setStatus({ state: "error", message: "Please check the highlighted fields." });
      focusFirstError(fieldErrors);
      return;
    }

    setStatus({ state: "submitting" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          website: honeypotRef.current?.value ?? "",
          startedAt: startedAt.current ?? Date.now(),
        }),
      });
      const result = (await response.json().catch(() => null)) as ContactResponse | null;

      if (response.ok && result?.ok) {
        setStatus({ state: "success" });
        setValues(EMPTY);
        startedAt.current = null;
        return;
      }
      if (result && !result.ok && result.code === "invalid") {
        setErrors(result.errors);
        focusFirstError(result.errors);
      }
      setStatus({
        state: "error",
        message:
          result && !result.ok
            ? result.message
            : "Sorry — something went wrong sending your message. Please try again.",
      });
    } catch {
      setStatus({
        state: "error",
        message: "We couldn’t reach the server. Please check your connection and try again.",
      });
    }
  };

  if (status.state === "success") {
    return (
      <div
        role="status"
        className="squircle flex flex-col items-start gap-5 rounded-card bg-white p-8 shadow-card md:p-10"
      >
        <span className="squircle grid size-14 place-items-center rounded-2xl bg-plum-600 text-white">
          <Icon name="check" size={26} />
        </span>
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Thank you — your message is on its way</h3>
          <p className="mt-2 text-plum-950/70">
            Someone from the church family will reply to the email address you gave us.
          </p>
        </div>
        <Button variant="tinted" onClick={() => setStatus({ state: "idle" })}>
          Send another message
        </Button>
      </div>
    );
  }

  const field = (
    name: ContactField,
    label: string,
    control: (props: {
      id: string;
      name: ContactField;
      value: string;
      "aria-invalid": boolean;
      "aria-describedby"?: string;
      disabled: boolean;
      onChange: (event: { target: { value: string } }) => void;
      className: string;
    }) => ReactNode,
  ) => {
    const id = `contact-${name}`;
    const errorId = `${id}-error`;
    return (
      <div>
        <label htmlFor={id} className="mb-2 block text-sm font-semibold">
          {label}
        </label>
        {control({
          id,
          name,
          value: values[name],
          "aria-invalid": Boolean(errors[name]),
          "aria-describedby": errors[name] ? errorId : undefined,
          disabled: submitting,
          onChange: (event) => update(name, event.target.value),
          className: inputClass,
        })}
        {errors[name] && (
          <p id={errorId} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-plum-700">
            <Icon name="alert" size={15} />
            {errors[name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onFocus={markStarted}
      noValidate
      aria-busy={submitting}
      className="squircle relative space-y-5 rounded-card bg-white p-6 shadow-card md:p-9"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {field("name", "Full name", (props) => (
          <input {...props} type="text" autoComplete="name" maxLength={CONTACT_LIMITS.name.max} required />
        ))}
        {field("email", "Email address", (props) => (
          <input
            {...props}
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={CONTACT_LIMITS.email.max}
            required
          />
        ))}
      </div>
      {field("subject", "Subject", (props) => (
        <input {...props} type="text" maxLength={CONTACT_LIMITS.subject.max} required />
      ))}
      {field("message", "Message", (props) => (
        <textarea
          {...props}
          rows={6}
          maxLength={CONTACT_LIMITS.message.max}
          required
          className={cn(props.className, "min-h-40 resize-y")}
        />
      ))}

      {/* Honeypot: hidden from people and assistive technology; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input ref={honeypotRef} id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div aria-live="polite" role="status">
        {status.state === "error" && (
          <p className="flex items-start gap-2 rounded-2xl bg-plum-50 px-4 py-3 text-sm font-medium text-plum-800">
            <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
            {status.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <p className="text-xs text-plum-950/55">We’ll only use your details to reply to you.</p>
        <Button type="submit" variant="primary" size="lg" disabled={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="size-4" /> Sending…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Icon name="send" size={17} /> Send message
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
