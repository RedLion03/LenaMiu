"use client";

import { useCallback, useEffect, useState } from "react";
import { youtubeEmbed } from "@/lib/media";
import type { SrcType } from "@/lib/supabase/database.types";

type Props = {
  src_type: SrcType;
  src: string;
  thumb: string | null;
  caption: string;
};

/**
 * Clickable thumbnail used in the admin moderation list. Opens a modal with
 * the full asset (video player / image / youtube embed) so the reviewer can
 * see what's actually being approved before clicking the button.
 */
export function AdminMediaPreview({ src_type, src, thumb, caption }: Props) {
  const [open, setOpen] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleKey]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block cursor-pointer"
        aria-label={`Preview ${caption}`}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={caption}
            className="h-12 w-20 rounded object-cover transition group-hover:opacity-80"
          />
        ) : (
          <div className="flex h-12 w-20 items-center justify-center rounded bg-ink/5 text-[10px] uppercase tracking-widest text-ink-3">
            preview
          </div>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-900 flex items-center justify-center bg-[rgba(10,10,20,0.9)] p-6 animate-fade-in"
          onClick={(e) => {
            if (e.currentTarget === e.target) setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-3xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -top-10 right-0 cursor-pointer text-2xl leading-none text-white/85 transition-colors hover:text-white"
            >
              ✕
            </button>
            <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-lightbox animate-pop-in">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                {src_type === "youtube" ? (
                  <iframe
                    src={youtubeEmbed(src)}
                    title={caption}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="block size-full border-0 object-contain"
                  />
                ) : src_type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={caption}
                    className="block size-full object-contain"
                  />
                ) : (
                  <video
                    src={src}
                    controls
                    autoPlay
                    playsInline
                    className="block size-full border-0 object-contain"
                  />
                )}
              </div>
              <p className="mt-3 px-2 text-center font-display text-lg italic text-ink-2">
                {caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
