/**
 * Contact form rules — shared by the form (instant feedback) and the API route
 * (the real gatekeeper). Keep them in one place so both always agree.
 */

export const CONTACT_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  subject: { min: 2, max: 150 },
  message: { min: 10, max: 5000 },
} as const;

/** Submissions faster than this (ms after the form was first used) are likely bots. */
export const MIN_FILL_TIME_MS = 2500;

export type ContactField = "name" | "email" | "subject" | "message";

export type ContactInput = Record<ContactField, string>;

export type ContactErrors = Partial<Record<ContactField, string>>;

/** The JSON body the form sends to POST /api/contact. */
export type ContactRequestBody = ContactInput & {
  /** Honeypot — real people never fill this in. */
  website: string;
  /** When the visitor first interacted with the form (ms since epoch). */
  startedAt: number;
};

/** What POST /api/contact returns. */
export type ContactResponse =
  | { ok: true }
  | { ok: false; code: "invalid"; message: string; errors: ContactErrors }
  | { ok: false; code: "not_configured" | "send_failed" | "bad_request" | "too_fast"; message: string };

// Pragmatic email check: something@something.tld, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trims every field and collapses the single-line fields' internal whitespace. */
export function normalizeContactInput(input: Partial<Record<ContactField, unknown>>): ContactInput {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  return {
    name: text(input.name).replace(/\s+/g, " "),
    email: text(input.email).toLowerCase(),
    subject: text(input.subject).replace(/\s+/g, " "),
    message: text(input.message).replace(/\r\n/g, "\n"),
  };
}

export function validateContactInput(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const { name, email, subject, message } = CONTACT_LIMITS;

  if (!input.name) errors.name = "Please enter your name.";
  else if (input.name.length < name.min) errors.name = "Please enter your full name.";
  else if (input.name.length > name.max) errors.name = `Please keep your name under ${name.max} characters.`;

  if (!input.email) errors.email = "Please enter your email address.";
  else if (input.email.length > email.max || !EMAIL_PATTERN.test(input.email))
    errors.email = "Please enter a valid email address, like name@example.com.";

  if (!input.subject) errors.subject = "Please add a subject.";
  else if (input.subject.length < subject.min) errors.subject = "Please add a slightly longer subject.";
  else if (input.subject.length > subject.max)
    errors.subject = `Please keep the subject under ${subject.max} characters.`;

  if (!input.message) errors.message = "Please write your message.";
  else if (input.message.length < message.min)
    errors.message = `Please write at least ${message.min} characters.`;
  else if (input.message.length > message.max)
    errors.message = `Please keep your message under ${message.max} characters.`;

  return errors;
}
