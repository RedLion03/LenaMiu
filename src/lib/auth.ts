import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { createServiceClient } from "./supabase/service";

export type AdminClient = ReturnType<typeof createServiceClient>;
export type AdminContext = { user: User; supabase: AdminClient };

/**
 * Returns the currently signed-in admin (Supabase Auth user + matching row in
 * public.admins). Null when the request is anon OR when the user is signed in
 * but not in the admins allowlist.
 *
 * The supabase client returned is the SERVICE ROLE client (bypasses RLS).
 * Every privileged read/write in /admin/** relies on this — the public RLS
 * policies only allow anon to read approved videos/messages, so all admin
 * queries (pending, rejected, drafts, anything in `admins` itself) need to
 * skip RLS.
 */
export async function getCurrentAdmin(): Promise<AdminContext | null> {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  let svc: AdminClient;
  try {
    svc = createServiceClient();
  } catch {
    return null;
  }

  const { data: row } = await svc
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row) return null;
  return { user, supabase: svc };
}

export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getCurrentAdmin();
  if (!ctx) redirect("/admin/login");
  return ctx;
}
