"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !EMAIL_RE.test(email)) {
    redirect("/admin/login?error=invalid-email");
  }
  if (!password) {
    redirect("/admin/login?error=missing-password");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data?.user) {
    redirect(
      `/admin/login?error=${encodeURIComponent(error?.message ?? "sign-in failed")}`,
    );
  }

  // The credentials are valid; the admins table is RLS-locked to service
  // role only, so the membership check has to bypass RLS.
  const svc = createServiceClient();
  const { data: row } = await svc
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!row) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=no-access");
  }

  redirect("/admin");
}
