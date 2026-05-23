"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { validateInviteToken } from "@/lib/invite";
import { deriveThumb } from "@/lib/cloudinary";
import { createServiceClient } from "@/lib/supabase/service";
import { notifyVideoLiked } from "@/lib/notifications";

const recipientSchema = z.enum(["lena", "miu", "both"]).default("both");

// ----------------------------------------------------------------------------
// Message slot — save (insert or update) and remove. One message per invite.
// ----------------------------------------------------------------------------
const messageSchema = z.object({
  token: z.string().min(1),
  message: z.string().trim().min(1, "message required").max(500, "too long"),
  recipient: recipientSchema,
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function saveMessage(formData: FormData) {
  const tokenRaw = String(formData.get("token") ?? "");

  const parsed = messageSchema.safeParse({
    token: tokenRaw,
    message: formData.get("message"),
    recipient: formData.get("recipient") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid";
    redirect(`/q/${tokenRaw}?error=${encodeURIComponent(msg)}`);
  }

  const invite = await validateInviteToken(parsed.data.token);
  if (!invite) {
    redirect(`/q/${parsed.data.token}?error=invite-invalid`);
  }

  const svc = createServiceClient();
  const { data: existing } = await svc
    .from("messages")
    .select("id")
    .eq("invite_id", invite.id)
    .maybeSingle();

  const { error } = existing
    ? await svc
        .from("messages")
        .update({
          text: parsed.data.message,
          status: "pending",
          reviewed_by: null,
          reviewed_at: null,
          recipient: parsed.data.recipient,
          image_url: parsed.data.imageUrl ?? null,
        })
        .eq("id", existing.id)
    : await svc.from("messages").insert({
        text: parsed.data.message,
        source: "qr",
        invite_id: invite.id,
        status: "pending",
        recipient: parsed.data.recipient,
        image_url: parsed.data.imageUrl ?? null,
      });

  if (error) {
    redirect(
      `/q/${parsed.data.token}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/q/${parsed.data.token}`);
  redirect(`/q/${parsed.data.token}?submitted=message`);
}

export async function removeMessage(formData: FormData) {
  const tokenRaw = String(formData.get("token") ?? "");
  const invite = await validateInviteToken(tokenRaw);
  if (!invite) {
    redirect(`/q/${tokenRaw}?error=invite-invalid`);
  }

  const svc = createServiceClient();
  await svc.from("messages").delete().eq("invite_id", invite.id);

  revalidatePath(`/q/${tokenRaw}`);
  redirect(`/q/${tokenRaw}?removed=message`);
}

// ----------------------------------------------------------------------------
// Video/image slot — save (insert or update in-place) and remove. One asset
// per invite (partial unique index videos_one_per_invite_idx enforces it).
// ----------------------------------------------------------------------------
const videoSchema = z.object({
  token: z.string().min(1),
  cloudinaryUrl: z.string().url("upload not finished"),
  caption: z.string().trim().min(1, "caption required").max(25),
  mode: z.enum(["video", "image"]).default("video"),
  recipient: recipientSchema,
});

export async function saveVideo(formData: FormData) {
  const tokenRaw = String(formData.get("token") ?? "");

  const parsed = videoSchema.safeParse({
    token: tokenRaw,
    cloudinaryUrl: formData.get("cloudinaryUrl"),
    caption: formData.get("caption"),
    mode: formData.get("mode") || undefined,
    recipient: formData.get("recipient") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid";
    redirect(`/q/${tokenRaw}?error=${encodeURIComponent(msg)}`);
  }

  const invite = await validateInviteToken(parsed.data.token);
  if (!invite) {
    redirect(`/q/${parsed.data.token}?error=invite-invalid`);
  }

  const svc = createServiceClient();
  const isImage = parsed.data.mode === "image";
  const src_type = isImage ? "image" : "upload";
  const thumb = isImage
    ? parsed.data.cloudinaryUrl
    : deriveThumb(parsed.data.cloudinaryUrl);

  const { data: existing } = await svc
    .from("videos")
    .select("id")
    .eq("invite_id", invite.id)
    .maybeSingle();

  if (existing) {
    // Update in place. Cloudinary asset left orphaned; TODO: queue cleanup.
    const { error } = await svc
      .from("videos")
      .update({
        src_type,
        src: parsed.data.cloudinaryUrl,
        thumb,
        caption: parsed.data.caption,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        recipient: parsed.data.recipient,
      })
      .eq("id", existing.id);
    if (error) {
      redirect(
        `/q/${parsed.data.token}?error=${encodeURIComponent(error.message)}`,
      );
    }
  } else {
    const { error } = await svc.from("videos").insert({
      src_type,
      src: parsed.data.cloudinaryUrl,
      thumb,
      caption: parsed.data.caption,
      source: "qr",
      invite_id: invite.id,
      status: "pending",
      recipient: parsed.data.recipient,
    });
    if (error) {
      redirect(
        `/q/${parsed.data.token}?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  revalidatePath(`/q/${parsed.data.token}`);
  redirect(`/q/${parsed.data.token}?submitted=video`);
}

export async function removeVideo(formData: FormData) {
  const tokenRaw = String(formData.get("token") ?? "");
  const invite = await validateInviteToken(tokenRaw);
  if (!invite) {
    redirect(`/q/${tokenRaw}?error=invite-invalid`);
  }

  const svc = createServiceClient();
  // TODO: also delete the Cloudinary asset.
  await svc.from("videos").delete().eq("invite_id", invite.id);

  revalidatePath(`/q/${tokenRaw}`);
  redirect(`/q/${tokenRaw}?removed=video`);
}

// ----------------------------------------------------------------------------
// Like — toggle on/off, fires notify on the create path only.
// ----------------------------------------------------------------------------
const likeSchema = z.object({
  token: z.string().min(1),
  videoId: z.string().uuid(),
});

export async function toggleLike(formData: FormData) {
  const parsed = likeSchema.safeParse({
    token: formData.get("token"),
    videoId: formData.get("video_id"),
  });
  if (!parsed.success) return;

  const invite = await validateInviteToken(parsed.data.token);
  if (!invite) return;

  const svc = createServiceClient();

  const { error: insertError } = await svc.from("likes").insert({
    video_id: parsed.data.videoId,
    invite_id: invite.id,
  });

  if (insertError?.code === "23505") {
    await svc
      .from("likes")
      .delete()
      .eq("video_id", parsed.data.videoId)
      .eq("invite_id", invite.id);
  } else if (!insertError) {
    after(() => notifyVideoLiked(parsed.data.videoId));
  }

  revalidatePath(`/q/${parsed.data.token}`);
}
