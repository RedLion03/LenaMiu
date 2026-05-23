"use client";

import { useId, useState } from "react";

type Role = "admin" | "qr" | "request";
export type MediaKind = "video" | "image";

export type UploadResult = {
  public_id: string;
  secure_url: string;
  format: string;
  duration?: number;
  bytes: number;
  resource_type: MediaKind;
};

type Props = {
  role: Role;
  kind?: MediaKind;
  inviteToken?: string;
  onChange: (result: UploadResult | null) => void;
};

type State =
  | { kind: "idle" }
  | { kind: "uploading"; pct: number; fileName: string }
  | { kind: "done"; result: UploadResult }
  | { kind: "error"; message: string };

const COPY = {
  video: {
    icon: "🎬",
    cta: "tap to choose a video",
    hint: "mp4 · mov · webm",
    accept: "video/*",
  },
  image: {
    icon: "🖼️",
    cta: "tap to choose an image",
    hint: "jpg · png · webp · gif",
    accept: "image/*",
  },
} satisfies Record<MediaKind, { icon: string; cta: string; hint: string; accept: string }>;

export function MediaUploader({
  role,
  kind = "video",
  inviteToken,
  onChange,
}: Props) {
  const inputId = useId();
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handleFile(file: File) {
    setState({ kind: "uploading", pct: 0, fileName: file.name });
    onChange(null);

    let signed: {
      cloud_name: string;
      api_key: string;
      timestamp: number;
      folder: string;
      signature: string;
      resource_type: MediaKind;
    };

    try {
      const res = await fetch("/api/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, kind, inviteToken }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `signature failed (${res.status})`);
      }
      signed = await res.json();
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signed.api_key);
    formData.append("timestamp", String(signed.timestamp));
    formData.append("folder", signed.folder);
    formData.append("signature", signed.signature);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${signed.cloud_name}/${signed.resource_type}/upload`,
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setState({
          kind: "uploading",
          fileName: file.name,
          pct: Math.round((e.loaded / e.total) * 100),
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const result: UploadResult = {
            public_id: data.public_id,
            secure_url: data.secure_url,
            format: data.format,
            duration: data.duration,
            bytes: data.bytes,
            resource_type: signed.resource_type,
          };
          setState({ kind: "done", result });
          onChange(result);
        } catch {
          setState({ kind: "error", message: "could not parse response" });
        }
      } else {
        let message = `upload failed (${xhr.status})`;
        try {
          const err = JSON.parse(xhr.responseText) as {
            error?: { message?: string };
          };
          message = err.error?.message ?? message;
        } catch {}
        setState({ kind: "error", message });
      }
    };

    xhr.onerror = () => setState({ kind: "error", message: "network error" });
    xhr.send(formData);
  }

  const disabled = state.kind === "uploading";
  const copy = COPY[kind];

  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-cream/40 p-6 text-center transition hover:border-sky">
      <input
        id={inputId}
        type="file"
        accept={copy.accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so picking the same file twice re-fires onChange.
          e.target.value = "";
        }}
      />
      <label
        htmlFor={inputId}
        className={`block ${disabled ? "cursor-progress" : "cursor-pointer"}`}
      >
        {state.kind === "idle" && (
          <>
            <div className="text-3xl">{copy.icon}</div>
            <div className="mt-2 text-xs uppercase tracking-widest text-ink-2">
              {copy.cta}
            </div>
            <div className="mt-1 text-[11px] text-ink-3">{copy.hint}</div>
          </>
        )}
        {state.kind === "uploading" && (
          <>
            <div className="text-2xl">⏳</div>
            <div className="mt-2 text-xs uppercase tracking-widest text-ink-2">
              uploading… {state.pct}%
            </div>
            <div className="mt-1 truncate text-[11px] text-ink-3">
              {state.fileName}
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full bg-sky-dark transition-all"
                style={{ width: `${state.pct}%` }}
              />
            </div>
          </>
        )}
        {state.kind === "done" && (
          <>
            <div className="text-2xl">✓</div>
            <div className="mt-2 text-xs uppercase tracking-widest text-emerald-700">
              uploaded
            </div>
            <div className="mt-1 truncate text-[11px] text-ink-3">
              {state.result.public_id}
            </div>
            <div className="mt-2 text-[11px] text-sky-deep underline">
              choose a different file
            </div>
          </>
        )}
        {state.kind === "error" && (
          <>
            <div className="text-2xl">⚠</div>
            <div className="mt-2 text-xs uppercase tracking-widest text-red-700">
              failed
            </div>
            <div className="mt-1 text-[11px] text-red-700">{state.message}</div>
            <div className="mt-2 text-[11px] text-sky-deep underline">
              try again
            </div>
          </>
        )}
      </label>
    </div>
  );
}
