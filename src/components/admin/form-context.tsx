"use client";

import { createContext, useContext } from "react";

type FormContextValue = {
  errors: Record<string, string>;
  pending: boolean;
  /** Mark the form as changed (for controls that don't fire native input events). */
  markDirty: () => void;
};

export const FormContext = createContext<FormContextValue>({ errors: {}, pending: false, markDirty: () => {} });

export const useFormContext = () => useContext(FormContext);

export function useFieldError(name: string) {
  return useContext(FormContext).errors[name];
}
