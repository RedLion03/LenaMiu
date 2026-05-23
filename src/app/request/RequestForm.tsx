"use client";

import { useState } from "react";
import { Film, Image as ImageIcon, MessageCircle } from "lucide-react";
import { requestMessage, requestUpload } from "./actions";
import { MediaUploader, type UploadResult } from "@/components/MediaUploader";
import { RecipientField } from "@/components/RecipientField";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  errorParam: string | null;
};

const ERRORS: Record<string, string> = {
  "invalid email": "That doesn't look like an email.",
  "caption required": "Caption is required.",
  "message required": "Write something before sending.",
  "too long": "Keep messages under 500 characters.",
  "provide a youtube link or upload a video":
    "Add a YouTube link or upload a video.",
  "provide an image": "Upload an image.",
  "could not parse youtube link": "That doesn't look like a YouTube link.",
  "invalid recipient": "Pick who this is for.",
};

type Kind = "video" | "image" | "message";

const TABS: { id: Kind; label: string; Icon: typeof Film }[] = [
  { id: "video", label: "video", Icon: Film },
  { id: "image", label: "image", Icon: ImageIcon },
  { id: "message", label: "message", Icon: MessageCircle },
];

export function RequestForm({ errorParam }: Props) {
  const [kind, setKind] = useState<Kind>("video");

  const error = errorParam
    ? (ERRORS[decodeURIComponent(errorParam)] ?? decodeURIComponent(errorParam))
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        className="flex items-end justify-center gap-8 border-b border-ink/10"
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = kind === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setKind(id)}
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

      {kind === "video" ? (
        <VideoForm error={error} />
      ) : kind === "image" ? (
        <ImageForm error={error} />
      ) : (
        <MessageForm error={error} />
      )}
    </div>
  );
}

function NameFields() {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="displayName"
        className="text-xs uppercase tracking-widest text-ink-2"
      >
        your name (optional)
      </label>
      <input
        id="displayName"
        name="displayName"
        type="text"
        maxLength={40}
        placeholder="how it'll appear publicly"
        className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink focus:border-sky-dark focus:outline-none"
      />
      <label className="flex items-center gap-2 text-xs text-ink-2">
        <input
          type="checkbox"
          name="showName"
          className="size-4 accent-sky-dark"
        />
        show my name publicly
      </label>
    </div>
  );
}

function EmailField() {
  return (
    <div>
      <label
        htmlFor="email"
        className="text-xs uppercase tracking-widest text-ink-2"
      >
        your email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
      />
      <p className="mt-1 text-[11px] text-ink-3">
        we&apos;ll email you when it&apos;s approved.
      </p>
    </div>
  );
}

function VideoForm({ error }: { error: string | null }) {
  const [mode, setMode] = useState<"youtube" | "upload">("youtube");
  const [upload, setUpload] = useState<UploadResult | null>(null);

  return (
    <form action={requestUpload} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value="video" />
      <input type="hidden" name="mode" value={mode} />
      <EmailField />

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
          placeholder="aunt's 50th birthday…"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
        />
      </div>

      <RecipientField />

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
          upload video
        </button>
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
          <MediaUploader role="request" kind="video" onChange={setUpload} />
        </>
      )}

      <NameFields />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <SubmitButton
        disabled={mode === "upload" && !upload}
        pendingLabel="sending…"
        className="self-start rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-4"
      >
        submit request
      </SubmitButton>
    </form>
  );
}

function ImageForm({ error }: { error: string | null }) {
  const [upload, setUpload] = useState<UploadResult | null>(null);

  return (
    <form action={requestUpload} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value="image" />
      <input
        type="hidden"
        name="cloudinaryUrl"
        value={upload?.secure_url ?? ""}
      />
      <EmailField />

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
          placeholder="picnic in the park…"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
        />
      </div>

      <RecipientField />

      <MediaUploader role="request" kind="image" onChange={setUpload} />

      <NameFields />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <SubmitButton
        disabled={!upload}
        pendingLabel="sending…"
        className="self-start rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-4"
      >
        submit request
      </SubmitButton>
    </form>
  );
}

function MessageForm({ error }: { error: string | null }) {
  const [image, setImage] = useState<UploadResult | null>(null);

  return (
    <form action={requestMessage} className="flex flex-col gap-4">
      <input
        type="hidden"
        name="imageUrl"
        value={image?.secure_url ?? ""}
      />
      <EmailField />

      <div>
        <label
          htmlFor="message"
          className="text-xs uppercase tracking-widest text-ink-2"
        >
          message
        </label>
        <textarea
          id="message"
          name="message"
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
        <p className="text-xs uppercase tracking-widest text-ink-2">
          attach an image (optional)
        </p>
        <div className="mt-2">
          <MediaUploader role="request" kind="image" onChange={setImage} />
        </div>
      </div>

      <NameFields />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <SubmitButton
        pendingLabel="sending…"
        className="self-start rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white disabled:cursor-wait disabled:opacity-70"
      >
        submit request
      </SubmitButton>
    </form>
  );
}
