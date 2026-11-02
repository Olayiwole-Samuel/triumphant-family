"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Shows its children only while another field in the same form has one of
 * the given values (checkboxes: "on" / "off"). Hidden fields are still sent;
 * the server ignores those that don't apply.
 */
export function ShowWhen({ field, is, children }: { field: string; is: string | string[]; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const values = Array.isArray(is) ? is : [is];

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const read = () => {
      const controls = form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[name="${field}"]`);
      const control = controls[0];
      if (!control) return;
      const value =
        control instanceof HTMLInputElement && control.type === "checkbox"
          ? control.checked
            ? "on"
            : "off"
          : control instanceof HTMLInputElement && control.type === "radio"
            ? (Array.from(controls as NodeListOf<HTMLInputElement>).find((c) => c.checked)?.value ?? "")
            : control.value;
      setVisible(values.includes(value));
    };
    read();
    form.addEventListener("change", read);
    form.addEventListener("input", read);
    return () => {
      form.removeEventListener("change", read);
      form.removeEventListener("input", read);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `is` is a static prop
  }, [field]);

  return (
    <div ref={ref} hidden={!visible} className="space-y-5">
      {children}
    </div>
  );
}
