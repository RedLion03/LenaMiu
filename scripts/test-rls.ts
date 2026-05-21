// =============================================================================
// RLS smoke test.
//
// Spawns an *anon* Supabase client and verifies that none of the privileged
// tables are readable or writable. Run after applying the migration against a
// real Supabase project:
//
//   npm run test:rls
//
// Requires NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in
// .env.local (loaded automatically by dotenv/config below).
//
// Exit code is non-zero if any "must-deny" assertion accidentally succeeds —
// useful as a CI gate.
// =============================================================================

import "dotenv/config";
import { createClient, PostgrestError } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — populate .env.local first.",
  );
  process.exit(2);
}

const anon = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type CheckResult = { ok: boolean; detail: string };

async function expectAllowedSelect(
  label: string,
  run: () => PromiseLike<{ data: unknown; error: PostgrestError | null }>,
): Promise<CheckResult> {
  const { data, error } = await run();
  if (error) return { ok: false, detail: `${label} errored: ${error.message}` };
  return { ok: true, detail: `${label} returned ${Array.isArray(data) ? data.length : "?"} rows` };
}

async function expectDenied(
  label: string,
  run: () => PromiseLike<{ data: unknown; error: PostgrestError | null }>,
): Promise<CheckResult> {
  const { data, error } = await run();
  if (error) return { ok: true, detail: `denied with: ${error.message}` };
  if (Array.isArray(data) && data.length === 0) {
    return { ok: true, detail: "empty result (RLS filtered)" };
  }
  return {
    ok: false,
    detail: `${label} unexpectedly returned data: ${JSON.stringify(data).slice(0, 200)}`,
  };
}

const checks: Array<{ name: string; run: () => Promise<CheckResult> }> = [
  {
    name: "anon CAN select approved videos",
    run: () =>
      expectAllowedSelect("approved videos", () =>
        anon.from("videos").select("id").eq("status", "approved"),
      ),
  },
  {
    name: "anon CANNOT select draft videos",
    run: () =>
      expectDenied("draft videos", () =>
        anon.from("videos").select("id").eq("status", "draft"),
      ),
  },
  {
    name: "anon CANNOT insert into videos",
    run: () =>
      expectDenied("videos insert", () =>
        anon.from("videos").insert({
          src_type: "youtube",
          src: "abcdefghijk",
          caption: "evil",
          owner_type: "qr",
        }),
      ),
  },
  {
    name: "anon CANNOT select qr_invites",
    run: () => expectDenied("qr_invites select", () => anon.from("qr_invites").select("id")),
  },
  {
    name: "anon CANNOT insert qr_invites",
    run: () =>
      expectDenied("qr_invites insert", () =>
        anon.from("qr_invites").insert({ label: "evil" }),
      ),
  },
  {
    name: "anon CANNOT select qr_submissions",
    run: () => expectDenied("qr_submissions select", () => anon.from("qr_submissions").select("id")),
  },
  {
    name: "anon CANNOT select likes",
    run: () => expectDenied("likes select", () => anon.from("likes").select("id")),
  },
  {
    name: "anon CANNOT select upload_requests",
    run: () => expectDenied("upload_requests select", () => anon.from("upload_requests").select("id")),
  },
  {
    name: "anon CANNOT insert upload_requests directly",
    run: () =>
      expectDenied("upload_requests insert", () =>
        anon.from("upload_requests").insert({
          requester_email: "x@y.z",
          proposed_caption: "evil",
          link_or_storage_key: "evil",
        }),
      ),
  },
  {
    name: "anon CANNOT select subscribers",
    run: () => expectDenied("subscribers select", () => anon.from("subscribers").select("id")),
  },
  {
    name: "anon CANNOT insert subscribers directly",
    run: () =>
      expectDenied("subscribers insert", () =>
        anon.from("subscribers").insert({ email: "x@y.z" }),
      ),
  },
  {
    name: "anon CANNOT select admins",
    run: () => expectDenied("admins select", () => anon.from("admins").select("user_id")),
  },
];

let failed = 0;
for (const c of checks) {
  const r = await c.run();
  const tag = r.ok ? "PASS" : "FAIL";
  console.log(`  [${tag}] ${c.name} — ${r.detail}`);
  if (!r.ok) failed++;
}
console.log("");
console.log(failed === 0 ? "✓ all RLS checks passed" : `✗ ${failed} RLS check(s) FAILED`);
process.exit(failed === 0 ? 0 : 1);
