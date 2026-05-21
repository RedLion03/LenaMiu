"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Polaroid, type VideoRow } from "./Polaroid";
import { Lightbox } from "./Lightbox";
import { toggleLike } from "@/app/q/[token]/actions";

type Props = {
  videos: VideoRow[];
  /** When set, hearts render on each polaroid and call toggleLike on submit. */
  qrToken?: string;
  /** Set of video ids this QR invite has already liked (for filled state). */
  myLikedIds?: string[];
  /** Map of videoId → invite label for QR-attributed videos (badge). */
  guestLabels?: Record<string, string | null>;
};

export function Gallery({
  videos,
  qrToken,
  myLikedIds,
  guestLabels,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const liked = new Set(myLikedIds ?? []);

  const navigate = (delta: number) => {
    setSelected((curr) => {
      if (curr === null || videos.length === 0) return curr;
      return (curr + delta + videos.length) % videos.length;
    });
  };

  return (
    <>
      <div className="flex flex-wrap justify-center gap-10 pb-4">
        {videos.map((video, i) => (
          <Polaroid
            key={video.id}
            video={video}
            index={i}
            onSelect={setSelected}
            guestLabel={guestLabels?.[video.id] ?? null}
            heart={
              qrToken ? (
                <form action={toggleLike}>
                  <input type="hidden" name="token" value={qrToken} />
                  <input type="hidden" name="video_id" value={video.id} />
                  <button
                    type="submit"
                    data-liked={liked.has(video.id)}
                    aria-label={liked.has(video.id) ? "unlike" : "like"}
                    className="inline-flex cursor-pointer items-center text-[#ff6b6b] [text-shadow:0_1px_2px_rgba(0,0,0,0.15)] transition duration-150 hover:scale-110 hover:text-[#ff3366] data-[liked=true]:text-[#ff1a55] data-[liked=true]:hover:text-[#e60044]"
                  >
                    <Heart
                      size={22}
                      strokeWidth={1.75}
                      fill={liked.has(video.id) ? "currentColor" : "none"}
                    />
                  </button>
                </form>
              ) : undefined
            }
          />
        ))}
      </div>
      {selected !== null && (
        <Lightbox
          videos={videos}
          index={selected}
          onClose={() => setSelected(null)}
          onNav={navigate}
        />
      )}
    </>
  );
}
