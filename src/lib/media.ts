// Pure helpers for turning a row in `videos` into renderable URLs.
// No I/O — safe to call from server and client.

import type { SrcType } from "./supabase/database.types";

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Returns true if the candidate is exactly an 11-char YouTube videoId.
 * This is the *only* shape we accept in videos.src for src_type='youtube' —
 * any other URL parsing happens at submission time, server-side.
 */
export function isYouTubeId(s: string): boolean {
  return YOUTUBE_ID.test(s);
}

export function youtubeThumb(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export function youtubeEmbed(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
}

/**
 * Derive a thumbnail URL from a Cloudinary video delivery URL using the
 * stock so_2,w_480,c_fill,q_auto transform — same pattern the original
 * _legacy SPA used in src/App.jsx:147-149.
 */
export function cloudinaryThumb(videoUrl: string): string {
  return videoUrl
    .replace("/video/upload/", "/video/upload/so_2,w_480,c_fill,q_auto/")
    .replace(/\.[^./?]+(\?.*)?$/, ".jpg$1");
}

/** Best-effort thumbnail for a video row. Returns null when nothing is renderable. */
export function thumbForVideo(
  srcType: SrcType,
  src: string,
  thumb: string | null,
): string | null {
  if (thumb) return thumb;
  if (srcType === "youtube") {
    return isYouTubeId(src) ? youtubeThumb(src) : null;
  }
  if (srcType === "upload") {
    return cloudinaryThumb(src);
  }
  return null;
}
