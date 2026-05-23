import "server-only";

import { createServiceClient } from "./supabase/service";
import type { WallMessage } from "@/components/MessageWall";

/**
 * For each video id passed in, return its invite label when the video came
 * from a QR submission. Uses videos.invite_id directly (post-consolidation).
 */
export async function fetchQrVideoLabels(
  videoIds: string[],
): Promise<Map<string, string | null>> {
  if (!videoIds.length) return new Map();
  let svc: ReturnType<typeof createServiceClient>;
  try {
    svc = createServiceClient();
  } catch {
    return new Map();
  }

  const { data: vids } = await svc
    .from("videos")
    .select("id, invite_id")
    .in("id", videoIds)
    .not("invite_id", "is", null);
  if (!vids?.length) return new Map();

  const inviteIds = Array.from(
    new Set(vids.map((v) => v.invite_id).filter((x): x is string => !!x)),
  );
  const { data: invites } = await svc
    .from("qr_invites")
    .select("id, label")
    .in("id", inviteIds);

  const labelByInvite = new Map(
    (invites ?? []).map((i) => [i.id, i.label]),
  );
  const result = new Map<string, string | null>();
  for (const v of vids) {
    if (v.invite_id) {
      result.set(v.id, labelByInvite.get(v.invite_id) ?? null);
    }
  }
  return result;
}

/**
 * Fetch every public-facing approved message from the consolidated table.
 * QR messages always carry the invite label as attribution; request messages
 * use display_name only when the author opted in (show_name=true).
 */
export async function fetchApprovedMessages(): Promise<WallMessage[]> {
  let svc: ReturnType<typeof createServiceClient>;
  try {
    svc = createServiceClient();
  } catch {
    return [];
  }

  const { data: rows, error } = await svc
    .from("messages")
    .select(
      "id, text, source, invite_id, display_name, show_name, recipient, image_url, created_at",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[messages] query failed (did you apply the latest migration?):",
      error.message,
    );
    return [];
  }
  if (!rows?.length) return [];

  // QR messages need the invite label as attribution.
  const inviteIds = Array.from(
    new Set(
      rows
        .filter((r) => r.source === "qr" && r.invite_id)
        .map((r) => r.invite_id!),
    ),
  );
  let labelByInvite = new Map<string, string | null>();
  if (inviteIds.length) {
    const { data: invites } = await svc
      .from("qr_invites")
      .select("id, label")
      .in("id", inviteIds);
    labelByInvite = new Map(
      (invites ?? []).map((i) => [i.id, i.label]),
    );
  }

  return rows.map((r) => {
    const fromGuest = r.source === "qr";
    const author = fromGuest
      ? (r.invite_id && labelByInvite.get(r.invite_id)) ?? null
      : r.show_name && r.display_name
        ? r.display_name
        : null;
    return {
      id: r.id,
      message: r.text,
      author,
      source: fromGuest ? "qr" : "request",
      recipient: r.recipient ?? "both",
      imageUrl: r.image_url ?? null,
      created_at: r.created_at,
    };
  });
}
