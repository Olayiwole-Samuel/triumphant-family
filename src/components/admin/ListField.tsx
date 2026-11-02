"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import { inputClass } from "./fields";
import { useFieldError, useFormContext } from "./form-context";
import { IconButton } from "./media-fields";

type Row = Record<string, string | boolean | undefined> & { id: string };

export type ListColumn = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "select" | "toggle";
  options?: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  hint?: string;
  /** Take the full row width (otherwise two columns on larger screens). */
  wide?: boolean;
  /** Show this column only when the row matches, e.g. { key: "kind", value: "video" }. */
  showWhen?: { key: string; value: string };
};

type ListFieldProps = {
  name: string;
  label: string;
  hint?: ReactNode;
  columns: ListColumn[];
  defaultValue?: Array<Record<string, unknown>>;
  /** Values for a new row. */
  newItem?: Record<string, string | boolean>;
  addLabel?: string;
  /** Column whose value titles each row (select columns show the option label). */
  titleKey?: string;
  /** Fallback row title, numbered: "Belief 1", "Belief 2"… */
  itemNoun?: string;
  max?: number;
  className?: string;
};

let counter = 0;
const newId = () => `row-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/**
 * A list of repeating items (beliefs, social links, programme, videos,
 * testimonies…): add, edit, reorder, remove. Submits a JSON array.
 */
export function ListField({
  name,
  label,
  hint,
  columns,
  defaultValue = [],
  newItem = {},
  addLabel = "Add item",
  titleKey,
  itemNoun = "Item",
  max = 50,
  className,
}: ListFieldProps) {
  const id = `${useId()}-${name}`;
  const error = useFieldError(name);
  const { markDirty } = useFormContext();
  const [rows, setRows] = useState<Row[]>(() =>
    defaultValue.map((item) => ({ ...(item as Row), id: typeof item.id === "string" ? item.id : newId() })),
  );

  const titleColumn = columns.find((column) => column.key === titleKey);
  const rowTitle = (row: Row, index: number) => {
    const value = titleKey ? row[titleKey] : undefined;
    if (typeof value === "string" && value.trim()) {
      return titleColumn?.options?.find((option) => option.value === value)?.label ?? value;
    }
    return `${itemNoun} ${index + 1}`;
  };

  const update = (next: Row[]) => {
    setRows(next);
    markDirty();
  };
  const setCell = (index: number, key: string, value: string | boolean) =>
    update(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const move = (index: number, by: number) => {
    const next = [...rows];
    const [row] = next.splice(index, 1);
    next.splice(index + by, 0, row);
    update(next);
  };

  return (
    <fieldset className={cn("min-w-0", className)} aria-describedby={hint || error ? `${id}-desc` : undefined}>
      <legend className="mb-1.5 block text-sm font-semibold text-plum-950">{label}</legend>
      {(error || hint) && (
        <p id={`${id}-desc`} className={cn("mb-3 text-[0.8125rem] leading-relaxed", error ? "font-medium text-danger-600" : "text-plum-950/55")}>
          {error ?? hint}
        </p>
      )}
      <input type="hidden" name={name} value={JSON.stringify(rows)} />

      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.id} className="rounded-2xl bg-white p-3.5 ring-1 ring-plum-950/10 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold text-plum-800">
                {rowTitle(row, index)}
              </p>
              <span className="flex shrink-0">
                <IconButton label="Move up" icon="arrowUp" disabled={index === 0} onClick={() => move(index, -1)} />
                <IconButton label="Move down" icon="arrowDown" disabled={index === rows.length - 1} onClick={() => move(index, 1)} />
                <IconButton label="Remove" icon="trash" danger onClick={() => update(rows.filter((_, i) => i !== index))} />
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {columns
                .filter((column) => !column.showWhen || row[column.showWhen.key] === column.showWhen.value)
                .map((column) => {
                  const cellId = `${id}-${index}-${column.key}`;
                  const value = row[column.key];
                  if (column.type === "toggle") {
                    return (
                      <label key={column.key} htmlFor={cellId} className="flex cursor-pointer items-center gap-3 sm:col-span-2">
                        <input
                          id={cellId}
                          type="checkbox"
                          checked={value === true}
                          onChange={(event) => setCell(index, column.key, event.target.checked)}
                          className="size-5 shrink-0 accent-plum-600"
                        />
                        <span className="text-sm text-plum-950">
                          {column.label}
                          {column.hint && <span className="block text-[0.8125rem] text-plum-950/55">{column.hint}</span>}
                        </span>
                      </label>
                    );
                  }
                  return (
                    <div key={column.key} className={cn((column.wide || column.type === "textarea") && "sm:col-span-2")}>
                      <label htmlFor={cellId} className="mb-1 block text-[0.8125rem] font-semibold text-plum-950">
                        {column.label}
                      </label>
                      {column.type === "textarea" ? (
                        <textarea
                          id={cellId}
                          rows={4}
                          value={typeof value === "string" ? value : ""}
                          placeholder={column.placeholder}
                          onChange={(event) => setCell(index, column.key, event.target.value)}
                          className={cn(inputClass, "resize-y")}
                        />
                      ) : column.type === "select" ? (
                        <select
                          id={cellId}
                          value={typeof value === "string" ? value : ""}
                          onChange={(event) => setCell(index, column.key, event.target.value)}
                          className={inputClass}
                        >
                          {column.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={cellId}
                          type={column.type === "url" ? "url" : "text"}
                          value={typeof value === "string" ? value : ""}
                          placeholder={column.placeholder}
                          onChange={(event) => setCell(index, column.key, event.target.value)}
                          className={inputClass}
                        />
                      )}
                      {column.hint && <p className="mt-1 text-[0.75rem] text-plum-950/55">{column.hint}</p>}
                    </div>
                  );
                })}
            </div>
          </li>
        ))}
      </ol>

      {rows.length < max && (
        <button
          type="button"
          onClick={() => update([...rows, { ...newItem, id: newId() }])}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-plum-100 px-4 text-sm font-semibold text-plum-800 hover:bg-plum-200"
        >
          <Icon name="plus" size={16} /> {addLabel}
        </button>
      )}
    </fieldset>
  );
}
