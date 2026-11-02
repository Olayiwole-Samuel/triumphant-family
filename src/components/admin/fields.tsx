"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import { useFieldError, useFormContext } from "./form-context";

export const inputClass =
  "block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[0.9375rem] text-plum-950 shadow-[0_1px_2px_rgb(26_6_20/0.04)] ring-1 ring-plum-950/12 transition-shadow placeholder:text-plum-950/35 focus:ring-2 focus:ring-plum-500 focus:outline-none aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger-600";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/** Label + control + hint + error, consistently laid out. */
export function FieldShell({ id, label, hint, error, required, children, className }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-plum-950">
        {label}
        {required && <span className="ml-1 text-plum-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-danger-600">
          <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-[0.8125rem] leading-relaxed text-plum-950/55">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type BaseProps = {
  name: string;
  label: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
};

function useField(name: string, hint?: ReactNode) {
  const id = `${useId()}-${name}`;
  const error = useFieldError(name);
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return { id, error, a11y: { "aria-invalid": error ? true : undefined, "aria-describedby": describedBy } as const };
}

export function TextField({
  name,
  label,
  hint,
  required,
  className,
  defaultValue,
  type = "text",
  placeholder,
  maxLength,
  autoComplete,
  inputMode,
}: BaseProps & {
  defaultValue?: string | null;
  type?: "text" | "url" | "email" | "tel" | "password";
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: "text" | "url" | "email" | "tel" | "numeric";
}) {
  const { id, error, a11y } = useField(name, hint);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete ?? "off"}
        inputMode={inputMode}
        required={required}
        className={inputClass}
        {...a11y}
      />
    </FieldShell>
  );
}

export function NumberField({
  name,
  label,
  hint,
  className,
  defaultValue,
  min,
  max,
}: BaseProps & { defaultValue?: number | null; min?: number; max?: number }) {
  const { id, error, a11y } = useField(name, hint);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        defaultValue={defaultValue ?? ""}
        className={cn(inputClass, "max-w-40")}
        {...a11y}
      />
    </FieldShell>
  );
}

export function DateField({ name, label, hint, required, className, defaultValue }: BaseProps & { defaultValue?: string | null }) {
  const { id, error, a11y } = useField(name, hint);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input id={id} name={name} type="date" defaultValue={defaultValue ?? ""} className={cn(inputClass, "max-w-56")} {...a11y} />
    </FieldShell>
  );
}

export function TimeField({ name, label, hint, required, className, defaultValue }: BaseProps & { defaultValue?: string | null }) {
  const { id, error, a11y } = useField(name, hint);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input id={id} name={name} type="time" step={300} defaultValue={defaultValue ?? ""} className={cn(inputClass, "max-w-40")} {...a11y} />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  required,
  className,
  defaultValue,
  options,
  placeholder,
}: BaseProps & {
  defaultValue?: string | null;
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Adds an empty first option with this text. */
  placeholder?: string;
}) {
  const { id, error, a11y } = useField(name, hint);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <select id={id} name={name} defaultValue={defaultValue ?? ""} className={cn(inputClass, "pr-9")} {...a11y}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** iOS-style switch. Submits "on" when switched on. */
export function ToggleField({
  name,
  label,
  hint,
  className,
  defaultChecked,
  onChange,
}: BaseProps & { defaultChecked?: boolean; onChange?: (checked: boolean) => void }) {
  const id = `${useId()}-${name}`;
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-semibold text-plum-950">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-plum-950/55">{hint}</span>}
      </label>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          onChange={(event) => onChange?.(event.target.checked)}
          className="peer h-7 w-12 cursor-pointer appearance-none rounded-full bg-plum-950/15 transition-colors checked:bg-plum-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-500"
        />
        <span className="pointer-events-none absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-[0_2px_4px_rgb(26_6_20/0.2)] transition-transform peer-checked:translate-x-5" />
      </span>
    </div>
  );
}

const FORMATTING = [
  { label: "Bold", icon: "B", wrap: ["**", "**"], sample: "bold text" },
  { label: "Italic", icon: "I", wrap: ["*", "*"], sample: "italic text" },
  { label: "Link", icon: "link", wrap: ["[", "](https://)"], sample: "link text" },
  { label: "Heading", icon: "H", line: "## " },
  { label: "Quote", icon: "❝", line: "> " },
  { label: "Bullet list", icon: "•", line: "- " },
] as const;

/** Multi-line text. `formatting` adds a small toolbar for bold, italic, links, headings, quotes and lists. */
export function TextAreaField({
  name,
  label,
  hint,
  required,
  className,
  defaultValue,
  rows = 4,
  maxLength,
  placeholder,
  formatting,
}: BaseProps & {
  defaultValue?: string | null;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  formatting?: boolean;
}) {
  const { id, error, a11y } = useField(name, hint);
  const ref = useRef<HTMLTextAreaElement>(null);
  const { markDirty } = useFormContext();

  function apply(tool: (typeof FORMATTING)[number]) {
    const area = ref.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end, value } = area;
    let next: string;
    let cursorStart: number;
    let cursorEnd: number;
    if ("wrap" in tool) {
      const selected = value.slice(start, end) || tool.sample;
      next = value.slice(0, start) + tool.wrap[0] + selected + tool.wrap[1] + value.slice(end);
      cursorStart = start + tool.wrap[0].length;
      cursorEnd = cursorStart + selected.length;
    } else {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      next = value.slice(0, lineStart) + tool.line + value.slice(lineStart);
      cursorStart = cursorEnd = end + tool.line.length;
    }
    area.value = next;
    area.focus();
    area.setSelectionRange(cursorStart, cursorEnd);
    markDirty();
  }

  return (
    <FieldShell
      id={id}
      label={label}
      hint={
        formatting ? (
          <>
            {hint && <>{hint} </>}Leave a blank line between paragraphs. Select words and use the buttons to format them.
          </>
        ) : (
          hint
        )
      }
      error={error}
      required={required}
      className={className}
    >
      {formatting && (
        <div className="mb-1.5 flex flex-wrap gap-1" role="toolbar" aria-label={`Formatting for ${label}`}>
          {FORMATTING.map((tool) => (
            <button
              key={tool.label}
              type="button"
              onClick={() => apply(tool)}
              title={tool.label}
              aria-label={tool.label}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-lg bg-plum-100 text-sm text-plum-800 hover:bg-plum-200",
                tool.icon === "B" && "font-bold",
                tool.icon === "I" && "italic",
              )}
            >
              {tool.icon === "link" ? <Icon name="link" size={16} /> : tool.icon}
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className={cn(inputClass, "resize-y leading-relaxed")}
        {...a11y}
      />
    </FieldShell>
  );
}

/** Words/phrases as removable chips (topics, scriptures…). Submits a JSON array. */
export function TagsField({
  name,
  label,
  hint,
  className,
  defaultValue,
  placeholder = "Type and press Enter",
  suggestions = [],
}: BaseProps & { defaultValue?: string[]; placeholder?: string; suggestions?: string[] }) {
  const { id, error, a11y } = useField(name, hint);
  const [tags, setTags] = useState<string[]>(defaultValue ?? []);
  const [draft, setDraft] = useState("");
  const { markDirty } = useFormContext();
  const listId = `${id}-suggestions`;

  function add(raw: string) {
    const value = raw.trim().replace(/,$/, "").trim();
    if (!value || tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) return setDraft("");
    setTags([...tags, value]);
    setDraft("");
    markDirty();
  }

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <div className={cn(inputClass, "flex min-h-11 flex-wrap items-center gap-1.5 py-1.5")}>
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-plum-100 py-1 pr-1 pl-3 text-sm text-plum-800">
            {tag}
            <button
              type="button"
              onClick={() => {
                setTags(tags.filter((t) => t !== tag));
                markDirty();
              }}
              className="inline-flex size-6 items-center justify-center rounded-full hover:bg-plum-200"
              aria-label={`Remove ${tag}`}
            >
              <Icon name="close" size={13} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          list={suggestions.length ? listId : undefined}
          onChange={(event) => {
            if (event.target.value.endsWith(",")) add(event.target.value);
            else setDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && tags.length) {
              setTags(tags.slice(0, -1));
              markDirty();
            }
          }}
          onBlur={() => add(draft)}
          placeholder={tags.length ? "" : placeholder}
          className="min-w-32 flex-1 border-0 bg-transparent px-1 py-1 text-[0.9375rem] outline-none"
          {...a11y}
        />
        {suggestions.length > 0 && (
          <datalist id={listId}>
            {suggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        )}
      </div>
    </FieldShell>
  );
}

/** A plain text input with a datalist of earlier values (categories, speakers, series…). */
export function SuggestField({
  suggestions,
  ...props
}: Parameters<typeof TextField>[0] & { suggestions: string[] }) {
  const listId = `${useId()}-list`;
  return (
    <>
      <TextFieldWithList {...props} listId={suggestions.length ? listId : undefined} />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      )}
    </>
  );
}

function TextFieldWithList({
  name,
  label,
  hint,
  required,
  className,
  defaultValue,
  placeholder,
  listId,
}: Parameters<typeof TextField>[0] & { listId?: string }) {
  const { id, error, a11y } = useField(name, hint);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        id={id}
        name={name}
        list={listId}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClass}
        {...a11y}
      />
    </FieldShell>
  );
}
