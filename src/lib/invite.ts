import "server-only";

import { cookies } from "next/headers";
import { createServiceClient } from "./supabase/service";
import type { Database } from "./supabase/database.types";

export type Invite = Database["public"]["Tables"]["qr_invites"]["Row"];

export const INVITE_COOKIE_NAME = "lenamiu_invite";

export async function setInviteCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(INVITE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function getInviteCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(INVITE_COOKIE_NAME)?.value ?? null;
}

export async function clearInviteCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(INVITE_COOKIE_NAME);
}

/**
 * Look up a qr_invites row by its UUID token. Returns null when the token
 * is unknown OR the invite has been revoked. The DB query uses the service
 * role so it bypasses RLS, but the only thing the lookup leaks is "this token
 * is currently valid", which is exactly the gate we want at /q/[token].
 */
export async function validateInviteToken(
  token: string | null | undefined,
): Promise<Invite | null> {
  if (!token) return null;

  let svc: ReturnType<typeof createServiceClient>;
  try {
    svc = createServiceClient();
  } catch {
    return null;
  }

  const { data, error } = await svc
    .from("qr_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  return data;
}

/** Read the cookie and revalidate the token against the DB. */
export async function getCurrentInvite(): Promise<Invite | null> {
  const token = await getInviteCookie();
  return validateInviteToken(token);
}
