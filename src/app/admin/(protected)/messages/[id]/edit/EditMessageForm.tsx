"use client";

import { useState } from "react";
import { updateMessage } from "../../actions";
import { MediaUploader, type UploadResult } from "@/components/MediaUploader";
import { RecipientField } from "@/components/RecipientField";
import { SubmitButton } from "@/components/SubmitButton";
import type { Recipient } from "@/lib/supabase/database.types";

type Status = "pending" | "approved" | "rejected";

type Props = {
  id: string;
  text: string;
  displayName: string | null;
  showName: boolean;
  status: Status;
  recipient: Recipient;
  imageUrl: string | null;
  errorParam: string | null;
};

export function EditMessageForm({
  id,
  text,
  displayName,
  showName,
  status,
  recipient,
  imageUrl,
  errorParam,
}: Props) {
  const [image, setImage] = useState<UploadResult | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const resolvedImageUrl = image
    ? image.secure_url
    : removeImage
      ? ""
      : (imageUrl ?? "");

  return (
    <form action={updateMessage} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="imageUrl" value={resolvedImageUrl} />

      <div>
        <label
          htmlFor="text"
          className="text-xs uppercase tracking-widest text-ink-2"
        >
          message
        </label>
        <textarea
          id="text"
          name="text"
          required
          minLength={1}
          maxLength={500}
          rows={5}
          defaultValue={text}
          className="mt-1 w-full resize-none rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink focus:border-sky-dark focus:outline-none"
        />
      </div>

      <RecipientField defaultValue={recipient ?? "both"} />

      <div>
        <label
          htmlFor="displayName"
          className="text-xs uppercase tracking-widest text-ink-2"
        >
          display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          maxLength={40}
          defaultValue={displayName ?? ""}
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          name="showName"
          defaultChecked={showName}
          className="size-4 accent-sky-dark"
        />
        show the name publicly
      </label>

      <div>
        <label
          htmlFor="status"
          className="text-xs uppercase tracking-widest text-ink-2"
        >
          status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
        >
          <option value="approved">approved (visible)</option>
          <option value="pending">pending</option>
          <option value="rejected">rejected (hidden)</option>
        </select>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-ink-2">
          attached image
        </p>
        {imageUrl && !removeImage && !image ? (
          <div className="mt-2 flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="current attachment"
              className="max-h-48 rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={() => setRemoveImage(true)}
              className="self-start text-xs uppercase tracking-widest text-red-700 underline hover:text-red-900"
            >
              remove image
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <MediaUploader role="admin" kind="image" onChange={setImage} />
            {removeImage && !image && (
              <button
                type="button"
                onClick={() => setRemoveImage(false)}
                className="mt-2 text-xs uppercase tracking-widest text-ink-2 underline"
              >
                keep current image
              </button>
            )}
          </div>
        )}
      </div>

      {errorParam && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {decodeURIComponent(errorParam)}
        </p>
      )}

      <SubmitButton
        pendingLabel="saving…"
        className="self-start rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white disabled:cursor-wait disabled:opacity-70"
      >
        save changes
      </SubmitButton>
    </form>
  );
}
