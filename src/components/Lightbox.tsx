"use client";

import { useCallback, useEffect } from "react";
import { youtubeEmbed } from "@/lib/media";
import type { VideoRow } from "./Polaroid";

type Props = {
  videos: VideoRow[];
  index: number;
  onClose: () => void;
  onNav: (delta: number) => void;
};

export function Lightbox({ videos, index, onClose, onNav }: Props) {
  const video = videos[index];

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onNav(-1);
      else if (e.key === "ArrowRight") onNav(1);
    },
    [onClose, onNav],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-900 flex flex-col items-center justify-center bg-[rgba(10,10,20,0.93)] animate-fade-in"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={video.caption}
    >
      <div className="relative w-[min(90vw,640px)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-[-44px] right-0 cursor-pointer text-2xl leading-none text-white/85 transition-colors hover:text-white"
        >
          ✕
        </button>
        <div className="relative bg-white px-4 pt-4 pb-16 shadow-lightbox animate-pop-in">
          <span
            aria-hidden
            className="absolute top-[-12px] left-1/2 h-6 w-[70px] -translate-x-1/2 -rotate-3 rounded-[2px] bg-[rgba(200,160,130,0.5)]"
          />
          <div className="aspect-video w-full overflow-hidden bg-black">
            {video.src_type === "youtube" ? (
              <iframe
                src={youtubeEmbed(video.src)}
                title={video.caption}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="block size-full border-0 object-contain"
              />
            ) : (
              <video
                src={video.src}
                controls
                autoPlay
                playsInline
                className="block size-full border-0 object-contain"
              />
            )}
          </div>
          <div className="font-script absolute inset-x-0 bottom-[18px] text-center text-3xl text-ink-3">
            {video.caption}
          </div>
        </div>
        <div className="mt-5 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => onNav(-1)}
            disabled={videos.length <= 1}
            aria-label="Previous"
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-base text-white transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-35"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => onNav(1)}
            disabled={videos.length <= 1}
            aria-label="Next"
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-base text-white transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-35"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
