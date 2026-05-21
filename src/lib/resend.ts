// =============================================================================
// SERVER-ONLY. Resend client + a thin `send()` wrapper that:
//   * lazily initializes Resend (so missing RESEND_API_KEY doesn't crash boot)
//   * no-ops gracefully when the key is absent (logs once, continues)
//   * never throws — callers can `await send()` and ignore the result, since
//     transactional email should not block user-facing actions
// =============================================================================

import "server-only";

import { Resend } from "resend";

let cached: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function send(
  args: SendArgs,
): Promise<{ sent: boolean; error?: string }> {
  const client = getClient();
  if (!client) {
    console.warn(
      "[resend] skipping send — RESEND_API_KEY is not set in .env.local",
    );
    return { sent: false, error: "not-configured" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  try {
    const { error } = await client.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (error) {
      console.error("[resend] send error:", error);
      return { sent: false, error: error.message ?? "send failed" };
    }
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[resend] threw:", msg);
    return { sent: false, error: msg };
  }
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
