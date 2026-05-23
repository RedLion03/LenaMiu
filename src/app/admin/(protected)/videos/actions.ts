"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { extractYouTubeId } from "@/lib/youtube";
import { deriveThumb } from "@/lib/cloudinary";
import {
  notifyNewVideoBlast,
  notifyRequestApproved,
  notifyRequestRejected,
} from "@/lib/notifications";

const recipientSchema = z.enum(["lena", "miu", "both"]).default("both");

const youtubeSchema = z.object({
  caption: z.string().trim().min(1, "caption required").max(25),
  youtubeUrl: z.string().trim().min(1, "youtube link required"),
  publishNow: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  recipient: recipientSchema,
});

export async function createYouTubeVideo(formData: FormData) {
  const { user, supabase } = await requireAdmin();

  const parsed = youtubeSchema.safeParse({
    caption: formData.get("caption"),
    youtubeUrl: formData.get("youtubeUrl"),
    publishNow: formData.get("publishNow"),
    recipient: formData.get("recipient") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/admin/videos/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`,
    );
  }

  const id = extractYouTubeId(parsed.data.youtubeUrl);
  if (!id) {
    redirect(
      `/admin/videos/new?error=${encodeURIComponent("could not parse youtube link")}`,
    );
  }

  const status = parsed.data.publishNow ? "approved" : "draft";
  const { data: inserted, error } = await supabase
    .from("videos")
    .insert({
      src_type: "youtube",
      src: id,
      caption: parsed.data.caption,
      source: "admin",
      status,
      recipient: parsed.data.recipient,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    redirect(
      `/admin/videos/new?error=${encodeURIComponent(error?.message ?? "insert failed")}`,
    );
  }

  if (status === "approved") {
    after(() => notifyNewVideoBlast(inserted.id));
  }

  revalidatePath("/");
  revalidatePath("/admin/videos");
  redirect("/admin/videos");
}

const uploadSchema = z.object({
  caption: z.string().trim().min(1, "caption required").max(25),
  cloudinaryUrl: z.string().url("upload not finished"),
  publishNow: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  recipient: recipientSchema,
});

export async function createUploadVideo(formData: FormData) {
  const { user, supabase } = await requireAdmin();

  const parsed = uploadSchema.safeParse({
    caption: formData.get("caption"),
    cloudinaryUrl: formData.get("cloudinaryUrl"),
    publishNow: formData.get("publishNow"),
    recipient: formData.get("recipient") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/admin/videos/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`,
    );
  }

  const thumb = deriveThumb(parsed.data.cloudinaryUrl);
  const status = parsed.data.publishNow ? "approved" : "draft";

  const { data: inserted, error } = await supabase
    .from("videos")
    .insert({
      src_type: "upload",
      src: parsed.data.cloudinaryUrl,
      thumb,
      caption: parsed.data.caption,
      source: "admin",
      status,
      recipient: parsed.data.recipient,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    redirect(
      `/admin/videos/new?error=${encodeURIComponent(error?.message ?? "insert failed")}`,
    );
  }

  if (status === "approved") {
    after(() => notifyNewVideoBlast(inserted.id));
  }

  revalidatePath("/");
  revalidatePath("/admin/videos");
  redirect("/admin/videos");
}

export async function createImageVideo(formData: FormData) {
  const { user, supabase } = await requireAdmin();

  const parsed = uploadSchema.safeParse({
    caption: formData.get("caption"),
    cloudinaryUrl: formData.get("cloudinaryUrl"),
    publishNow: formData.get("publishNow"),
    recipient: formData.get("recipient") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/admin/videos/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`,
    );
  }

  const status = parsed.data.publishNow ? "approved" : "draft";

  const { data: inserted, error } = await supabase
    .from("videos")
    .insert({
      src_type: "image",
      src: parsed.data.cloudinaryUrl,
      thumb: parsed.data.cloudinaryUrl,
      caption: parsed.data.caption,
      source: "admin",
      status,
      recipient: parsed.data.recipient,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    redirect(
      `/admin/videos/new?error=${encodeURIComponent(error?.message ?? "insert failed")}`,
    );
  }

  if (status === "approved") {
    after(() => notifyNewVideoBlast(inserted.id));
  }

  revalidatePath("/");
  revalidatePath("/admin/videos");
  redirect("/admin/videos");
}

const updateSchema = z.object({
  id: z.string().uuid(),
  caption: z.string().trim().min(1).max(25),
  status: z.enum(["draft", "pending", "approved", "rejected"]),
  recipient: recipientSchema,
});

export async function updateVideo(formData: FormData) {
  const { user, supabase } = await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    caption: formData.get("caption"),
    status: formData.get("status"),
    recipient: formData.get("recipient") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/admin/videos?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`,
    );
  }

  const { data: prev } = await supabase
    .from("videos")
    .select("status, source")
    .eq("id", parsed.data.id)
    .maybeSingle();

  const transitioningToApproved =
    prev?.status !== "approved" && parsed.data.status === "approved";
  const transitioningToRejected =
    prev?.status !== "rejected" && parsed.data.status === "rejected";

  const { error } = await supabase
    .from("videos")
    .update({
      caption: parsed.data.caption,
      status: parsed.data.status,
      recipient: parsed.data.recipient,
      ...(transitioningToApproved || transitioningToRejected
        ? { reviewed_by: user.id, reviewed_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(`/admin/videos?error=${encodeURIComponent(error.message)}`);
  }

  if (transitioningToApproved) {
    const videoId = parsed.data.id;
    after(async () => {
      if (prev?.source === "requested") {
        await notifyRequestApproved(videoId);
      }
      await notifyNewVideoBlast(videoId);
    });
  } else if (transitioningToRejected && prev?.source === "requested") {
    const videoId = parsed.data.id;
    after(() => notifyRequestRejected(videoId));
  }

  revalidatePath("/");
  revalidatePath("/admin/videos");
  redirect("/admin/videos");
}

export async function deleteVideo(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/videos?error=missing-id");

  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) {
    redirect(`/admin/videos?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/videos");
  redirect("/admin/videos");
}

export async function setVideoStatus(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("status") ?? "") as
    | "draft"
    | "pending"
    | "approved"
    | "rejected";
  if (!id || !["draft", "pending", "approved", "rejected"].includes(next)) {
    redirect("/admin/videos?error=invalid-status");
  }

  const { data: prev } = await supabase
    .from("videos")
    .select("status, source")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("videos")
    .update({
      status: next,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/videos?error=${encodeURIComponent(error.message)}`);
  }

  if (prev?.status !== "approved" && next === "approved") {
    after(async () => {
      if (prev?.source === "requested") {
        await notifyRequestApproved(id);
      }
      await notifyNewVideoBlast(id);
    });
  } else if (prev?.status !== "rejected" && next === "rejected" && prev?.source === "requested") {
    after(() => notifyRequestRejected(id));
  }

  revalidatePath("/");
  revalidatePath("/admin/videos");
}
