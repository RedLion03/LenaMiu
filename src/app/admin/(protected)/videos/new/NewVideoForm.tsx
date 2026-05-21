"use client";

import { useState } from "react";
import {
  createUploadVideo,
  createYouTubeVideo,
} from "../actions";
import { VideoUploader, type UploadResult } from "@/components/VideoUploader";

type Props = {
  errorParam: string | null;
};

const ERRORS: Record<string, string> = {
  "caption required": "Caption is required.",
  "youtube link required": "Paste a YouTube link.",
  "could not parse youtube link": "That doesn't look like a YouTube link.",
  "upload not finished": "Wait for the upload to finish before saving.",
};

export function NewVideoForm({ errorParam }: Props) {
  const [mode, setMode] = useState<"youtube" | "upload">("youtube");
  const [upload, setUpload] = useState<UploadResult | null>(null);

  const action = mode === "youtube" ? createYouTubeVideo : createUploadVideo;
  const error = errorParam
    ? (ERRORS[decodeURIComponent(errorParam)] ?? decodeURIComponent(errorParam))
    : null;

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("youtube")}
          className={`flex-1 rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${
            mode === "youtube"
              ? "bg-sky text-ink"
              : "border border-ink/15 text-ink-2 hover:bg-ink/5"
          }`}
        >
          youtube link
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex-1 rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${
            mode === "upload"
              ? "bg-sky text-ink"
              : "border border-ink/15 text-ink-2 hover:bg-ink/5"
          }`}
        >
          upload from device
        </button>
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
          <VideoUploader role="admin" onChange={setUpload} />
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

      <button
        type="submit"
        disabled={mode === "upload" && !upload}
        className="self-start rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-4"
      >
        save
      </button>
    </form>
  );
}
