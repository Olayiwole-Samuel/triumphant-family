import "server-only";
import type { ContactInput } from "./validation";

/** Escapes text for safe inclusion in HTML email. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain, readable notification sent to the church inbox. All values escaped. */
export function buildContactEmail(input: ContactInput, churchName: string) {
  const subject = `Website message: ${input.subject}`.replace(/[\r\n]+/g, " ").slice(0, 200);

  const text = [
    `New message from the ${churchName} website`,
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Subject: ${input.subject}`,
    "",
    input.message,
    "",
    "— Reply to this email to respond directly to the sender.",
  ].join("\n");

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 16px 4px 0;color:#6b4a5e;font-size:13px;vertical-align:top">${label}</td><td style="padding:4px 0;font-size:15px;color:#1a0614">${escapeHtml(value)}</td></tr>`;

  const html = `<!doctype html>
<html><body style="margin:0;background:#fbf7fa;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <p style="margin:0 0 16px;color:#7b2d5e;font-size:13px;font-weight:600">${escapeHtml(churchName)} · Website message</p>
    <div style="background:#ffffff;border-radius:16px;padding:24px">
      <table role="presentation" style="border-collapse:collapse;margin-bottom:16px">
        ${row("Name", input.name)}
        ${row("Email", input.email)}
        ${row("Subject", input.subject)}
      </table>
      <div style="border-top:1px solid #f5ecf2;padding-top:16px;font-size:15px;line-height:1.6;color:#1a0614;white-space:pre-wrap">${escapeHtml(input.message)}</div>
    </div>
    <p style="margin:16px 0 0;color:#6b4a5e;font-size:12px">Reply to this email to respond directly to the sender.</p>
  </div>
</body></html>`;

  return { subject, text, html };
}
