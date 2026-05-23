"use client";

import { useState } from "react";
import { Film, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import {
  createImageVideo,
  createUploadVideo,
  createYouTubeVideo,
} from "../actions";
import { MediaUploader, type UploadResult } from "@/components/MediaUploader";
import { RecipientField } from "@/components/RecipientField";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  errorParam: string | null;
};

const ERRORS: Record<string, string> = {
  "caption required": "Caption is required.",
  "youtube link required": "Paste a YouTube link.",
  "could not parse youtube link": "That doesn't look like a YouTube link.",
  "upload not finished": "Wait for the upload to finish before saving.",
};

type Mode = "youtube" | "upload" | "image";

export function NewVideoForm({ errorParam }: Props) {
  const [mode, setMode] = useState<Mode>("youtube");
  const [upload, setUpload] = useState<UploadResult | null>(null);

  const action =
    mode === "youtube"
      ? createYouTubeVideo
      : mode === "image"
        ? createImageVideo
        : createUploadVideo;
  const error = errorParam
    ? (ERRORS[decodeURIComponent(errorParam)] ?? decodeURIComponent(errorParam))
    : null;

  const TABS: { id: Mode; label: string; Icon: typeof Film }[] = [
    { id: "youtube", label: "youtube", Icon: LinkIcon },
    { id: "upload", label: "video", Icon: Film },
    { id: "image", label: "image", Icon: ImageIcon },
  ];

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <div
        role="tablist"
        className="flex items-end justify-center gap-8 border-b border-ink/10"
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMode(id);
                setUpload(null);
              }}
              className={`-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-1 pb-3 text-xs uppercase tracking-widest transition-colors ${
                active
                  ? "border-sky-deep text-ink"
                  : "border-transparent text-ink-3 hover:text-ink-2"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </button>
          );
        })}
      </div>

      <div>
        <label
          htmlFor="caption"
          className="text-xs uppercase tracking-widest text-ink-2"
        >
          caption
        </label>
        <input
          id="caption"
          name="caption"
          type="text"
          required
          maxLength={25}
          placeholder="summer 2025…"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
        />
      </div>

      <RecipientField />

      {mode === "youtube" ? (
        <div>
          <label
            htmlFor="youtubeUrl"
            className="text-xs uppercase tracking-widest text-ink-2"
          >
            youtube link
          </label>
          <input
            id="youtubeUrl"
            name="youtubeUrl"
            type="url"
            required
            placeholder="https://youtube.com/watch?v=…"
            className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
          />
        </div>
      ) : (
        <>
          <input
            type="hidden"
            name="cloudinaryUrl"
            value={upload?.secure_url ?? ""}
          />
          <MediaUploader
            role="admin"
            kind={mode === "image" ? "image" : "video"}
            onChange={setUpload}
          />
        </>
      )}

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          name="publishNow"
          defaultChecked
          className="size-4 accent-sky-dark"
        />
        publish to the gallery now
      </label>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <SubmitButton
        disabled={(mode === "upload" || mode === "image") && !upload}
        pendingLabel="saving…"
        className="self-start rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-4"
      >
        save
      </SubmitButton>
    </form>
  );
}
