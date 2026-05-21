"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { deriveThumb } from "@/lib/cloudinary";
import { extractYouTubeId } from "@/lib/youtube";

const uploadSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("invalid email"),
    caption: z.string().trim().min(1, "caption required").max(25),
    mode: z.enum(["youtube", "upload"]),
    youtubeUrl: z.string().optional(),
    cloudinaryUrl: z.string().optional(),
    displayName: z.string().trim().max(40).optional(),
    showName: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  })
  .refine(
    (d) =>
      (d.mode === "youtube" && Boolean(d.youtubeUrl?.length)) ||
      (d.mode === "upload" && Boolean(d.cloudinaryUrl?.length)),
    { message: "provide a youtube link or upload a video" },
  );

export async function requestUpload(formData: FormData) {
  const parsed = uploadSchema.safeParse({
    email: formData.get("email"),
    caption: formData.get("caption"),
    mode: formData.get("mode"),
    youtubeUrl: formData.get("youtubeUrl") || undefined,
    cloudinaryUrl: formData.get("cloudinaryUrl") || undefined,
    displayName: formData.get("displayName") || undefined,
    showName: formData.get("showName"),
  });
  if (!parsed.success) {
    redirect(
      `/request?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`,
    );
  }

  let src: string;
  let src_type: "youtube" | "upload";
  let thumb: string | null = null;
  if (parsed.data.mode === "youtube") {
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
});

export async function requestMessage(formData: FormData) {
  const parsed = messageSchema.safeParse({
    email: formData.get("email"),
    message: formData.get("message"),
    displayName: formData.get("displayName") || undefined,
    showName: formData.get("showName"),
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
  });

  if (error) {
    redirect(`/request?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/request?submitted=message");
}
