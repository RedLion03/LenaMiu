// ============================================================================
// SERVER-ONLY. Bypasses RLS. Use only inside route handlers and server actions
// AFTER you have validated the request (invite token, signed unsubscribe, etc).
// Importing this file from a client component will throw at build time thanks
// to the `server-only` package below.
// ============================================================================

import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createServiceClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  cached = createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "lenamiu-service" } },
  });
  return cached;
}
