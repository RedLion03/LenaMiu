"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export async function createInvite(formData: FormData) {
  const { supabase } = await requireAdmin();
  const labelRaw = String(formData.get("label") ?? "").trim();
  const label = labelRaw.length ? labelRaw.slice(0, 80) : null;

  const { error } = await supabase.from("qr_invites").insert({ label });
  if (error) {
    redirect(`/admin/invites?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/invites");
  redirect("/admin/invites");
}

export async function revokeInvite(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/invites?error=missing-id");

  const { error } = await supabase
    .from("qr_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`/admin/invites?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/admin/invites");
}

export async function unrevokeInvite(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/invites?error=missing-id");

  const { error } = await supabase
    .from("qr_invites")
    .update({ revoked_at: null })
    .eq("id", id);

  if (error) {
    redirect(`/admin/invites?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/admin/invites");
}

export async function deleteInvite(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/invites?error=missing-id");

  const { error } = await supabase.from("qr_invites").delete().eq("id", id);
  if (error) {
    redirect(`/admin/invites?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/admin/invites");
  redirect("/admin/invites");
}
