// =============================================================================
// Grant admin to an email. Creates the auth.users row (if missing) with the
// given password, or resets the password on an existing user. Then ensures
// they're in public.admins. Idempotent — re-run to rotate the password.
//
// Usage:
//   npm run admin:create -- email@example.com               # generates password
//   npm run admin:create -- email@example.com 'my-password' # uses provided
//
// The password is printed ONCE to stdout. Save it.
// =============================================================================

import "dotenv/config";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const email = process.argv[2]?.trim().toLowerCase();
const providedPassword = process.argv[3]?.trim();
if (!email || !email.includes("@")) {
  console.error(
    "Usage: npm run admin:create -- email@example.com [password]",
  );
  process.exit(1);
}

// Crockford-ish base32 — no I, L, O, U, 0, 1.
const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
function generatePassword(): string {
  const bytes = randomBytes(20);
  let raw = "";
  for (const b of bytes) raw += ALPHABET[b % ALPHABET.length];
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}-${raw.slice(15, 20)}`;
}

const password = providedPassword || generatePassword();
if (password.replace(/-/g, "").length < 8) {
  console.error("✗ Password must be at least 8 characters.");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(target: string) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

let user = await findUserByEmail(email);
let action: "created" | "updated";

if (!user) {
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("✗ createUser failed:", error.message);
    process.exit(1);
  }
  user = data.user!;
  action = "created";
} else {
  const { error } = await sb.auth.admin.updateUserById(user.id, {
    password,
  });
  if (error) {
    console.error("✗ password update failed:", error.message);
    process.exit(1);
  }
  action = "updated";
}

const { error: upsertError } = await sb
  .from("admins")
  .upsert({ user_id: user.id }, { onConflict: "user_id" });

if (upsertError) {
  console.error("✗ admins upsert failed:", upsertError.message);
  process.exit(1);
}

console.log("");
console.log(`✓ Admin ${action}.`);
console.log("");
console.log(`  email:     ${email}`);
console.log(`  user_id:   ${user.id}`);
console.log(`  password:  ${password}`);
console.log("");
console.log("Sign in at /admin/login with email + password.");
console.log("");
