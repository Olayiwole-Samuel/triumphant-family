import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { buildContactEmail } from "@/lib/contact/email";
import {
  MIN_FILL_TIME_MS,
  normalizeContactInput,
  validateContactInput,
  type ContactResponse,
} from "@/lib/contact/validation";
import { getSiteSettings } from "@/lib/content";

const MAX_BODY_BYTES = 20_000;

function reply(body: ContactResponse, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/contact — sends a contact-form message to the church via Resend.
 *
 * Status codes: 200 sent · 400 malformed/too fast · 413 too large ·
 * 415 not JSON · 422 invalid fields · 502 Resend rejected · 503 not configured.
 *
 * Privacy: message contents and sender details are never logged.
 * Setup: README → "Contact form (Resend)".
 */
export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return reply({ ok: false, code: "bad_request", message: "Please send the form as JSON." }, 415);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return reply({ ok: false, code: "bad_request", message: "That message is too long to send." }, 413);
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return reply({ ok: false, code: "bad_request", message: "The form data could not be read." }, 400);
  }

  // Honeypot: a hidden field only bots fill in. Pretend success, send nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return reply({ ok: true }, 200);
  }

  // Timing check: real people take a few seconds to fill in the form.
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : NaN;
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_TIME_MS) {
    return reply(
      { ok: false, code: "too_fast", message: "That was very quick! Please check your message and try again." },
      400,
    );
  }

  const input = normalizeContactInput(body);
  const errors = validateContactInput(input);
  if (Object.keys(errors).length) {
    return reply(
      { ok: false, code: "invalid", message: "Please check the highlighted fields.", errors },
      422,
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.error("[contact] Email is not configured (RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL).");
    return reply(
      {
        ok: false,
        code: "not_configured",
        message:
          "Our contact form isn’t set up to send messages yet. Please reach us using the contact details on this page.",
      },
      503,
    );
  }

  const settings = await getSiteSettings();
  const email = buildContactEmail(input, settings.churchName);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: to.split(",").map((address) => address.trim()).filter(Boolean),
      replyTo: input.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    if (error) {
      console.error(`[contact] Resend rejected the message: ${error.name} (${error.statusCode ?? "no status"})`);
      return reply(
        {
          ok: false,
          code: "send_failed",
          message: "Sorry — your message couldn’t be sent right now. Please try again shortly.",
        },
        502,
      );
    }
  } catch (error) {
    console.error(`[contact] Could not reach Resend: ${error instanceof Error ? error.name : "unknown error"}`);
    return reply(
      {
        ok: false,
        code: "send_failed",
        message: "Sorry — your message couldn’t be sent right now. Please try again shortly.",
      },
      502,
    );
  }

  return reply({ ok: true }, 200);
}
