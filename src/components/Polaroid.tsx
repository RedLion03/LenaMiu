import type { CSSProperties } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { thumbForVideo } from "@/lib/media";

export type VideoRow = Database["public"]["Tables"]["videos"]["Row"];

const ROTATIONS = ["-2.8deg", "1.5deg", "-1deg", "2.2deg", "-1.8deg", "2.6deg", "-0.8deg"];

type Props = {
  video: VideoRow;
  index: number;
  onSelect: (index: number) => void;
  /** Optional content rendered in the bottom-left of the polaroid (QR like button). */
  heart?: React.ReactNode;
  /** Invite label for QR-uploaded videos. Always shown when source is QR. */
  guestLabel?: string | null;
};

export function Polaroid({
  video,
  index,
  onSelect,
  heart,
  guestLabel,
}: Props) {
  const rot = ROTATIONS[index % ROTATIONS.length];
  const tapeRot = index % 2 === 0 ? "-4deg" : "3deg";
  const thumb = thumbForVideo(video.src_type, video.src, video.thumb);
  const fromGuest = video.source === "qr";

  // QR videos always carry attribution via the invite label (admin-set).
  // Other sources (request/admin) use the optional display_name + show_name
  // opt-in pair.
  const badgeName = fromGuest
    ? (guestLabel?.trim() || "guest")
    : video.show_name && video.display_name?.trim()
      ? video.display_name.trim()
      : null;

  return (
    <article
      className={`group relative w-72 shrink-0 cursor-pointer ${fromGuest ? "bg-sky-light" : "bg-white"} px-3.5 pt-3.5 pb-14 shadow-polaroid rotate-(--rot,0deg) transition-[transform,box-shadow] duration-350 ease-bounce hover:rotate-0 hover:scale-[1.06] hover:shadow-polaroid-hover hover:z-10`}
      style={
        {
          "--rot": rot,
          "--tape-rot": tapeRot,
        } as CSSProperties
      }
    >
      <span
        aria-hidden
        className={`absolute top-[-11px] left-1/2 h-[22px] w-[58px] -translate-x-1/2 rotate-(--tape-rot,-4deg) rounded-[2px] ${fromGuest ? "bg-[rgba(30,111,165,0.55)]" : "bg-[rgba(200,160,130,0.5)]"}`}
      />
      {badgeName && (
        <span
          className="absolute top-2 right-2 z-2 max-w-[140px] truncate rounded-full bg-sky-deep px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-white shadow-sm"
          title={`by ${badgeName}`}
        >
          {badgeName}
        </span>
      )}
      <button
        type="button"
        className="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden bg-[#e8e8e8]"
        onClick={() => onSelect(index)}
        aria-label={`Open ${video.caption}`}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={video.caption}
            loading="lazy"
            className="pointer-events-none block size-full object-cover"
          />
        ) : (
          <div className="text-xs uppercase tracking-widest text-gray-400">
            no preview
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-250 group-hover:bg-black/20">
          <div
            aria-hidden
            className="flex size-13 scale-0 items-center justify-center rounded-full bg-white/90 text-xl text-ink opacity-0 transition-[transform,opacity] duration-250ms ease-bounce group-hover:scale-100 group-hover:opacity-100"
          >
            ▶
          </div>
        </div>
      </button>
      <div className="font-script absolute inset-x-0 bottom-[14px] px-2 text-center text-2xl leading-tight text-ink-3">
        {video.caption}
      </div>
      {heart && (
        <div className="absolute bottom-1.5 left-2 z-2">{heart}</div>
      )}
    </article>
  );
}
