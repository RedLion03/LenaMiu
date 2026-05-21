"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

function generatePassword(): string {
  const bytes = randomBytes(20);
  let raw = "";
  for (const b of bytes) raw += ALPHABET[b % ALPHABET.length];
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}-${raw.slice(15, 20)}`;
}

const addSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email"),
  password: z.string().optional(),
});

export async function addAdmin(formData: FormData) {
  await requireAdmin();

  const parsed = addSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/admin/admins?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`,
    );
  }

  const providedPassword = parsed.data.password?.trim();
  if (providedPassword && providedPassword.length < 8) {
    redirect("/admin/admins?error=password-too-short");
  }
  const password = providedPassword || generatePassword();

  const svc = createServiceClient();

  // Locate existing auth.users row (paginated; capped at first 200 — fine for
  // our scale and matches the CLI).
  const { data: list, error: listErr } = await svc.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) {
    redirect(`/admin/admins?error=${encodeURIComponent(listErr.message)}`);
  }
  const existing = list?.users.find(
    (u) => u.email?.toLowerCase() === parsed.data.email,
  );

  let userId: string;
  if (existing) {
    const { error } = await svc.auth.admin.updateUserById(existing.id, {
      password,
    });
    if (error) {
      redirect(`/admin/admins?error=${encodeURIComponent(error.message)}`);
    }
    userId = existing.id;
  } else {
    const { data, error } = await svc.auth.admin.createUser({
      email: parsed.data.email,
      password,
      email_confirm: true,
    });
    if (error || !data?.user) {
      redirect(
        `/admin/admins?error=${encodeURIComponent(error?.message ?? "createUser failed")}`,
      );
    }
    userId = data.user.id;
  }

  const { error: upsertErr } = await svc
    .from("admins")
    .upsert({ user_id: userId }, { onConflict: "user_id" });
  if (upsertErr) {
    redirect(`/admin/admins?error=${encodeURIComponent(upsertErr.message)}`);
  }

  revalidatePath("/admin/admins");
  redirect(
    `/admin/admins?just=${encodeURIComponent(parsed.data.email)}&password=${encodeURIComponent(password)}`,
  );
}

export async function removeAdmin(formData: FormData) {
  const { user } = await requireAdmin();
  const targetId = String(formData.get("user_id") ?? "");
  if (!targetId) redirect("/admin/admins?error=missing-id");

  if (targetId === user.id) {
    redirect("/admin/admins?error=cant-remove-self");
  }

  const svc = createServiceClient();
  const { count } = await svc
    .from("admins")
    .select("user_id", { count: "exact", head: true });
  if ((count ?? 0) <= 1) {
    redirect("/admin/admins?error=cant-remove-last");
  }

  const { error } = await svc.from("admins").delete().eq("user_id", targetId);
  if (error) {
    redirect(`/admin/admins?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/admins");
}
