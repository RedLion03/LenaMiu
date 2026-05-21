"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  removeMessage,
  removeVideo,
  saveMessage,
  saveVideo,
} from "@/app/q/[token]/actions";
import { VideoUploader, type UploadResult } from "./VideoUploader";

type Status = "pending" | "approved" | "rejected";

type Existing = {
  message: { status: Status; text: string } | null;
  video: {
    status: Status;
    caption: string;
    thumb: string | null;
  } | null;
};

type Props = {
  token: string;
  errorParam: string | null;
  submitted: "message" | "video" | null;
  removedSlot: "message" | "video" | null;
  existing: Existing;
};

const ERRORS: Record<string, string> = {
  "message required": "Write something before sending.",
  "too long": "Keep messages under 500 characters.",
  "caption required": "Add a caption for the video.",
  "upload not finished": "Wait for the upload to finish before sending.",
  "invite-invalid": "This invite is no longer valid.",
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "waiting for review",
  approved: "approved",
  rejected: "not accepted",
};

const STATUS_TONE: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export function QrSubmitForm({
  token,
  errorParam,
  submitted,
  removedSlot,
  existing,
}: Props) {
  const error =
    errorParam &&
    (ERRORS[decodeURIComponent(errorParam)] ?? decodeURIComponent(errorParam));

  return (
    <div className="flex flex-col gap-6">
      <MessageCard
        token={token}
        existing={existing.message}
        justSubmitted={submitted === "message"}
        justRemoved={removedSlot === "message"}
      />
      <VideoCard
        token={token}
        existing={existing.video}
        justSubmitted={submitted === "video"}
        justRemoved={removedSlot === "video"}
      />
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs uppercase tracking-widest ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function MessageCard({
  token,
  existing,
  justSubmitted,
  justRemoved,
}: {
  token: string;
  existing: Existing["message"];
  justSubmitted: boolean;
  justRemoved: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const showForm = !existing || editing;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <h3 className="font-display text-lg font-medium text-ink">
        leave a message
      </h3>
      {justSubmitted && !editing && (
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          saved — waiting for approval.
        </p>
      )}
      {justRemoved && !existing && (
        <p className="mt-2 rounded-xl bg-ink/5 px-3 py-2 text-xs text-ink-2">
          message removed.
        </p>
      )}

      {showForm ? (
        <form action={saveMessage} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="token" value={token} />
          <textarea
            name="message"
            required
            minLength={1}
            maxLength={500}
            rows={4}
            defaultValue={existing?.text ?? ""}
            placeholder="say something nice…"
            className="resize-none rounded-xl border border-ink/15 bg-cream px-4 py-3 text-ink focus:border-sky-dark focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            {existing && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="cursor-pointer rounded-full px-4 py-2 text-xs uppercase tracking-widest text-ink-2 hover:bg-ink/5"
              >
                cancel
              </button>
            )}
            <button
              type="submit"
              className="cursor-pointer rounded-full bg-sky px-5 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white"
            >
              {existing ? "save changes" : "send"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3">
          <blockquote className="whitespace-pre-wrap border-l-2 border-sky pl-3 text-sm italic text-ink">
            {existing.text}
          </blockquote>
          <div className="mt-3 flex items-center justify-between">
            <StatusBadge status={existing.status} />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="edit message"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <Pencil size={15} strokeWidth={1.75} />
              </button>
              <form
                action={removeMessage}
                onSubmit={(e) => {
                  if (!confirm("remove your message?")) e.preventDefault();
                }}
              >
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  aria-label="remove message"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({
  token,
  existing,
  justSubmitted,
  justRemoved,
}: {
  token: string;
  existing: Existing["video"];
  justSubmitted: boolean;
  justRemoved: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const showForm = !existing || editing;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <h3 className="font-display text-lg font-medium text-ink">
        share a video
      </h3>
      {justSubmitted && !editing && (
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          saved — waiting for approval.
        </p>
      )}
      {justRemoved && !existing && (
        <p className="mt-2 rounded-xl bg-ink/5 px-3 py-2 text-xs text-ink-2">
          video removed.
        </p>
      )}

      {showForm ? (
        <form action={saveVideo} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="token" value={token} />
          <input
            type="hidden"
            name="cloudinaryUrl"
            value={upload?.secure_url ?? ""}
          />
          <input
            name="caption"
            type="text"
            required
            maxLength={25}
            defaultValue={existing?.caption ?? ""}
            placeholder="caption…"
            className="rounded-xl border border-ink/15 bg-cream px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
          />
          <VideoUploader role="qr" inviteToken={token} onChange={setUpload} />
          <div className="flex justify-end gap-2">
            {existing && (
              <button
                type="button"
                onClick={() => {
                  setUpload(null);
                  setEditing(false);
                }}
                className="cursor-pointer rounded-full px-4 py-2 text-xs uppercase tracking-widest text-ink-2 hover:bg-ink/5"
              >
                cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!upload}
              className="cursor-pointer rounded-full bg-sky px-5 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-4"
            >
              {existing ? "replace" : "send"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3">
          {existing.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={existing.thumb}
              alt={existing.caption}
              className="aspect-video w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-ink/5 text-xs uppercase tracking-widest text-ink-3">
              processing…
            </div>
          )}
          <p className="mt-2 text-sm italic text-ink-2">{existing.caption}</p>
          <div className="mt-3 flex items-center justify-between">
            <StatusBadge status={existing.status} />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="replace video"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <Pencil size={15} strokeWidth={1.75} />
              </button>
              <form
                action={removeVideo}
                onSubmit={(e) => {
                  if (!confirm("remove your video?")) e.preventDefault();
                }}
              >
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  aria-label="remove video"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
