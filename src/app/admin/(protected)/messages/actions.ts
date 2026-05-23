"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

const recipientSchema = z.enum(["lena", "miu", "both"]).default("both");
const imageUrlSchema = z
  .string()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

const createSchema = z.object({
  text: z.string().trim().min(1, "message required").max(500, "too long"),
  displayName: z.string().trim().max(40).optional(),
  showName: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  recipient: recipientSchema,
  imageUrl: imageUrlSchema,
});

const updateSchema = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(1, "message required").max(500, "too long"),
  displayName: z.string().trim().max(40).optional(),
  showName: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  status: z.enum(["pending", "approved", "rejected"]),
  recipient: recipientSchema,
  imageUrl: imageUrlSchema,
});

export async function createMessage(formData: FormData) {
  const { user, supabase } = await requireAdmin();

  const parsed = createSchema.safeParse({
    text: formData.get("text"),
    displayName: formData.get("displayName") || undefined,
    showName: formData.get("showName"),
    recipient: formData.get("recipient") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/admin/messages/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`,
    );
  }

  const { error } = await supabase.from("messages").insert({
    text: parsed.data.text,
    source: "admin",
    status: "approved",
    requester_email: user.email ?? null,
    display_name: parsed.data.displayName?.length
      ? parsed.data.displayName
      : null,
    show_name: parsed.data.showName,
    recipient: parsed.data.recipient,
    image_url: parsed.data.imageUrl ?? null,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    created_by: user.id,
  });

  if (error) {
    redirect(`/admin/messages/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/messages");
  redirect("/admin/messages");
}

export async function updateMessage(formData: FormData) {
  const { user, supabase } = await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    text: formData.get("text"),
    displayName: formData.get("displayName") || undefined,
    showName: formData.get("showName"),
    status: formData.get("status"),
    recipient: formData.get("recipient") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/admin/messages?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`,
    );
  }

  const { data: prev } = await supabase
    .from("messages")
    .select("status")
    .eq("id", parsed.data.id)
    .maybeSingle();

  const reviewing =
    prev?.status !== parsed.data.status &&
    (parsed.data.status === "approved" || parsed.data.status === "rejected");

  const { error } = await supabase
    .from("messages")
    .update({
      text: parsed.data.text,
      display_name: parsed.data.displayName?.length
        ? parsed.data.displayName
        : null,
      show_name: parsed.data.showName,
      status: parsed.data.status,
      recipient: parsed.data.recipient,
      image_url: parsed.data.imageUrl ?? null,
      ...(reviewing
        ? { reviewed_by: user.id, reviewed_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(`/admin/messages?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/messages");
  redirect("/admin/messages");
}

export async function deleteMessage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/messages?error=missing-id");

  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) {
    redirect(`/admin/messages?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/messages");
}

export async function setMessageStatus(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("status") ?? "") as
    | "pending"
    | "approved"
    | "rejected";
  if (!id || !["pending", "approved", "rejected"].includes(next)) {
    redirect("/admin/messages?error=invalid-status");
  }

  const { error } = await supabase
    .from("messages")
    .update({
      status: next,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/messages?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/messages");
}
