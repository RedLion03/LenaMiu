"use client";

import { useState } from "react";
import { QrSubmitForm } from "@/components/QrSubmitForm";
import { Sheet } from "@/components/Sheet";
import type { Recipient } from "@/lib/supabase/database.types";

type Status = "pending" | "approved" | "rejected";

type Existing = {
  message: {
    status: Status;
    text: string;
    recipient: Recipient;
    image_url: string | null;
  } | null;
  video: {
    status: Status;
    caption: string;
    thumb: string | null;
    src_type: "upload" | "youtube" | "image";
    recipient: Recipient;
  } | null;
};

type Props = {
  token: string;
  errorParam: string | null;
  submitted: "message" | "video" | null;
  removedSlot: "message" | "video" | null;
  existing: Existing;
};

export function QrLeaveTrigger({
  token,
  errorParam,
  submitted,
  removedSlot,
  existing,
}: Props) {
  // Auto-open after a server-action redirect (these props come from URL
  // search params, so deriving the initial state directly is correct — the
  // component is re-created with fresh props on every navigation).
  const [open, setOpen] = useState(
    () => Boolean(submitted || errorParam || removedSlot),
  );

  const hasMessage = !!existing.message;
  const hasVideo = !!existing.video;

  const label =
    hasMessage && hasVideo
      ? "edit your message or video"
      : hasMessage
        ? "add a video · edit message"
        : hasVideo
          ? "add a message · edit video"
          : "leave a message or video";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer uppercase transition-colors hover:text-ink"
      >
        {label}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Leave a message or video"
      >
        <QrSubmitForm
          token={token}
          errorParam={errorParam}
          submitted={submitted}
          removedSlot={removedSlot}
          existing={existing}
        />
      </Sheet>
    </>
  );
}
