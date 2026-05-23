"use client";

import { useState } from "react";
import { createMessage } from "../actions";
import { MediaUploader, type UploadResult } from "@/components/MediaUploader";
import { RecipientField } from "@/components/RecipientField";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  errorParam: string | null;
};

export function NewMessageForm({ errorParam }: Props) {
  const [image, setImage] = useState<UploadResult | null>(null);

  return (
    <form action={createMessage} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="imageUrl" value={image?.secure_url ?? ""} />

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
          placeholder="say something nice…"
          className="mt-1 w-full resize-none rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink focus:border-sky-dark focus:outline-none"
        />
      </div>

      <RecipientField />

      <div>
        <label
          htmlFor="displayName"
          className="text-xs uppercase tracking-widest text-ink-2"
        >
          display name (optional)
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          maxLength={40}
          placeholder="how it'll appear publicly"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          name="showName"
          className="size-4 accent-sky-dark"
        />
        show the name publicly
      </label>

      <div>
        <p className="text-xs uppercase tracking-widest text-ink-2">
          attach an image (optional)
        </p>
        <div className="mt-2">
          <MediaUploader role="admin" kind="image" onChange={setImage} />
        </div>
      </div>

      {errorParam && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {decodeURIComponent(errorParam)}
        </p>
      )}

      <SubmitButton
        pendingLabel="publishing…"
        className="self-start rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white disabled:cursor-wait disabled:opacity-70"
      >
        publish
      </SubmitButton>
    </form>
  );
}
