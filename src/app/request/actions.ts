"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { deriveThumb } from "@/lib/cloudinary";
import { extractYouTubeId } from "@/lib/youtube";

const recipientSchema = z.enum(["lena", "miu", "both"]).default("both");

const uploadSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("invalid email"),
    caption: z.string().trim().min(1, "caption required").max(25),
    kind: z.enum(["video", "image"]).default("video"),
    mode: z.enum(["youtube", "upload"]).optional(),
    youtubeUrl: z.string().optional(),
    cloudinaryUrl: z.string().optional(),
    displayName: z.string().trim().max(40).optional(),
    showName: z.preprocess((v) => v === "on" || v === true, z.boolean()),
    recipient: recipientSchema,
  })
  .superRefine((d, ctx) => {
    if (d.kind === "image") {
      if (!d.cloudinaryUrl?.length) {
        ctx.addIssue({
          code: "custom",
          message: "provide an image",
        });
      }
      return;
    }
    const ok =
      (d.mode === "youtube" && Boolean(d.youtubeUrl?.length)) ||
      (d.mode === "upload" && Boolean(d.cloudinaryUrl?.length));
    if (!ok) {
      ctx.addIssue({
        code: "custom",
        message: "provide a youtube link or upload a video",
      });
    }
  });

export async function requestUpload(formData: FormData) {
  const parsed = uploadSchema.safeParse({
    email: formData.get("email"),
    caption: formData.get("caption"),
    kind: formData.get("kind") || undefined,
    mode: formData.get("mode") || undefined,
    youtubeUrl: formData.get("youtubeUrl") || undefined,
    cloudinaryUrl: formData.get("cloudinaryUrl") || undefined,
    displayName: formData.get("displayName") || undefined,
    showName: formData.get("showName"),
    recipient: formData.get("recipient") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/request?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`,
    );
  }

  let src: string;
  let src_type: "youtube" | "upload" | "image";
  let thumb: string | null = null;

  if (parsed.data.kind === "image") {
    src = parsed.data.cloudinaryUrl!;
    src_type = "image";
    thumb = src;
  } else if (parsed.data.mode === "youtube") {
    const id = extractYouTubeId(parsed.data.youtubeUrl!);
    if (!id) {
      redirect(
        `/request?error=${encodeURIComponent("could not parse youtube link")}`,
      );
    }
    src = id;
    src_type = "youtube";
  } else {
    src = parsed.data.cloudinaryUrl!;
    src_type = "upload";
    thumb = deriveThumb(src);
  }

  const svc = createServiceClient();
  const { error } = await svc.from("videos").insert({
    src_type,
    src,
    thumb,
    caption: parsed.data.caption,
    source: "requested",
    status: "pending",
    requester_email: parsed.data.email,
    display_name: parsed.data.displayName?.length
      ? parsed.data.displayName
      : null,
    show_name: parsed.data.showName,
    recipient: parsed.data.recipient,
  });

  if (error) {
    redirect(`/request?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/request?submitted=video");
}

const messageSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email"),
  message: z.string().trim().min(1, "message required").max(500, "too long"),
  displayName: z.string().trim().max(40).optional(),
  showName: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  recipient: recipientSchema,
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function requestMessage(formData: FormData) {
  const parsed = messageSchema.safeParse({
    email: formData.get("email"),
    message: formData.get("message"),
    displayName: formData.get("displayName") || undefined,
    showName: formData.get("showName"),
    recipient: formData.get("recipient") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/request?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`,
    );
  }

  const svc = createServiceClient();
  const { error } = await svc.from("messages").insert({
    text: parsed.data.message,
    source: "requested",
    status: "pending",
    requester_email: parsed.data.email,
    display_name: parsed.data.displayName?.length
      ? parsed.data.displayName
      : null,
    show_name: parsed.data.showName,
    recipient: parsed.data.recipient,
    image_url: parsed.data.imageUrl ?? null,
  });

  if (error) {
    redirect(`/request?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/request?submitted=message");
}
