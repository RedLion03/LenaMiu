// =============================================================================
// High-level notification senders. Each function:
//   * pulls the data it needs via service role (so RLS doesn't get in the way)
//   * formats a small HTML email
//   * delegates to `send()` (which no-ops gracefully if Resend isn't configured)
//
// Callers should wrap these in `after()` so the response isn't held up by
// email delivery.
// =============================================================================

import "server-only";

import { appUrl, escapeHtml, send } from "./resend";
import { createServiceClient } from "./supabase/service";

const SHELL_STYLE = [
  "font-family: Georgia, 'Cormorant Garamond', serif",
  "background: #f9f5ee",
  "color: #1a1a2e",
  "padding: 32px",
  "border-radius: 12px",
  "max-width: 480px",
  "margin: 24px auto",
  "line-height: 1.6",
].join("; ");

const LINK_STYLE = "color: #3a9de0; text-decoration: underline";

function shell(inner: string): string {
  return `<div style="${SHELL_STYLE}">${inner}</div>`;
}

// ----------------------------------------------------------------------------
// 1) QR user liked a video → e-mail to videos.owner_email (when present).
// ----------------------------------------------------------------------------
export async function notifyVideoLiked(videoId: string) {
  const svc = createServiceClient();
  const { data: video } = await svc
    .from("videos")
    .select("id, caption, requester_email, likes_count")
    .eq("id", videoId)
    .maybeSingle();
  if (!video?.requester_email) return;

  const html = shell(`
    <h1 style="font-size: 28px; margin: 0 0 16px;">someone loved your memory</h1>
    <p>your video <strong>${escapeHtml(video.caption)}</strong> just got a like ♡</p>
    <p style="color: #666; font-size: 14px;">${video.likes_count} ${
      video.likes_count === 1 ? "like" : "likes"
    } total</p>
    <p><a href="${appUrl()}" style="${LINK_STYLE}">see the gallery</a></p>
  `);

  await send({
    to: video.requester_email,
    subject: `someone liked "${video.caption}" ♡`,
    html,
  });
}

// ----------------------------------------------------------------------------
// 2) Video transitioned to approved → blast to all active subscribers.
// ----------------------------------------------------------------------------
export async function notifyNewVideoBlast(videoId: string) {
  const svc = createServiceClient();
  const { data: video } = await svc
    .from("videos")
    .select("id, caption")
    .eq("id", videoId)
    .maybeSingle();
  if (!video) return;

  const { data: subs } = await svc
    .from("subscribers")
    .select("email, unsubscribe_token")
    .eq("status", "active");
  if (!subs?.length) return;

  await Promise.allSettled(
    subs.map((sub) => {
      const unsubscribeUrl = `${appUrl()}/unsubscribe/${sub.unsubscribe_token}`;
      const html = shell(`
        <h1 style="font-size: 28px; margin: 0 0 16px;">a new memory ♡</h1>
        <p><em>${escapeHtml(video.caption)}</em> just joined the gallery.</p>
        <p><a href="${appUrl()}" style="${LINK_STYLE}">view it now</a></p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 24px 0;" />
        <p style="font-size: 11px; color: #888;">
          <a href="${unsubscribeUrl}" style="${LINK_STYLE}">unsubscribe</a>
          · made with ♡ by LenaMiu
        </p>
      `);
      return send({
        to: sub.email,
        subject: `new memory: ${video.caption}`,
        html,
      });
    }),
  );
}

// ----------------------------------------------------------------------------
// 3) Requested video approved → e-mail to requester (their memory is live).
// ----------------------------------------------------------------------------
export async function notifyRequestApproved(videoId: string) {
  const svc = createServiceClient();
  const { data: v } = await svc
    .from("videos")
    .select("requester_email, caption")
    .eq("id", videoId)
    .maybeSingle();
  if (!v?.requester_email) return;

  const html = shell(`
    <h1 style="font-size: 28px; margin: 0 0 16px;">your memory is live ✓</h1>
    <p><em>${escapeHtml(v.caption)}</em> just joined the gallery.</p>
    <p><a href="${appUrl()}" style="${LINK_STYLE}">see it now</a></p>
  `);

  await send({
    to: v.requester_email,
    subject: `your memory is live ♡`,
    html,
  });
}

// ----------------------------------------------------------------------------
// 4) Requested video rejected → e-mail to requester (with optional notes).
// ----------------------------------------------------------------------------
export async function notifyRequestRejected(videoId: string) {
  const svc = createServiceClient();
  const { data: v } = await svc
    .from("videos")
    .select("requester_email, caption, reviewer_notes")
    .eq("id", videoId)
    .maybeSingle();
  if (!v?.requester_email) return;

  const noteBlock = v.reviewer_notes
    ? `<blockquote style="border-left: 2px solid #ccc; padding-left: 12px; color: #666; font-style: italic;">${escapeHtml(v.reviewer_notes)}</blockquote>`
    : "";

  const html = shell(`
    <h1 style="font-size: 28px; margin: 0 0 16px;">about your memory submission</h1>
    <p>your request for <em>${escapeHtml(v.caption)}</em> won't be joining the gallery this time.</p>
    ${noteBlock}
    <p>thanks for thinking of us. you can <a href="${appUrl()}/request" style="${LINK_STYLE}">submit another</a>.</p>
  `);

  await send({
    to: v.requester_email,
    subject: `about your memory submission`,
    html,
  });
}
