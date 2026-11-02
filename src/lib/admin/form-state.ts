/** Result of an admin form action (shared by server actions and the form UI). */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string; at: number }
  | { status: "error"; message: string; errors: Record<string, string>; at: number };

export const IDLE: FormState = { status: "idle" };

export const success = (message: string): FormState => ({ status: "success", message, at: Date.now() });

export const failure = (message: string, errors: Record<string, string> = {}): FormState => ({
  status: "error",
  message,
  errors,
  at: Date.now(),
});

/** A server action used by an admin form. */
export type FormAction = (state: FormState, data: FormData) => Promise<FormState>;
