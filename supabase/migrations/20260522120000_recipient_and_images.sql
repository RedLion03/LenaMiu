-- ============================================================================
-- Add `recipient` to videos and messages, plus image support.
--
-- recipient ∈ ('lena', 'miu', 'both') — who the submission is for. Drives
-- the polaroid/message background colour on the gallery. Defaults to 'both'
-- so existing rows remain valid.
--
-- videos: extend src_type to allow 'image' (still upload-served via
-- Cloudinary; rendered as <img> instead of <video>).
-- messages: add nullable image_url so authors can attach a Cloudinary image
-- alongside the text (text remains required).
-- ============================================================================

alter table public.videos
  drop constraint videos_src_type_check;
alter table public.videos
  add constraint videos_src_type_check
    check (src_type in ('upload', 'youtube', 'image'));

alter table public.videos
  add column recipient text not null default 'both'
    check (recipient in ('lena', 'miu', 'both'));

alter table public.messages
  add column recipient text not null default 'both'
    check (recipient in ('lena', 'miu', 'both'));

alter table public.messages
  add column image_url text;
