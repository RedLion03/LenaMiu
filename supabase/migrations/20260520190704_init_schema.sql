-- ============================================================================
-- LenaMiu initial schema (consolidated).
--
-- Two content tables: `videos` and `messages`. Both carry status + source
-- + (requester_email OR invite_id) + display_name/show_name + reviewer
-- audit fields. Moderation = update status from pending → approved/rejected
-- on the canonical row.
--
-- Anon RLS posture:
--   * approved videos and approved messages are publicly readable
--   * everything else is locked. All privileged work goes through the
--     service_role client in route handlers / server actions AFTER
--     validating the request (admin cookie, invite token, signed unsub).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- admins — gate for /admin/**. Linked to auth.users; populated via the
-- CLI script (npm run admin:create) or the in-app /admin/admins page.
-- ----------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- No policies — anon/authenticated have zero access. The service role
-- bypasses RLS for the auth check in lib/auth.ts.

-- ----------------------------------------------------------------------------
-- qr_invites — admin generates one per guest; QR code points at
-- /q/<token>. Used + revoked are admin-visible flags.
-- ----------------------------------------------------------------------------
create table public.qr_invites (
  id         uuid primary key default gen_random_uuid(),
  token      uuid not null unique default gen_random_uuid(),
  label      text,
  used_at    timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.qr_invites enable row level security;
-- No anon policies. validateInviteToken in lib/invite.ts uses service role
-- to verify a token without exposing the table.

-- ----------------------------------------------------------------------------
-- videos — canonical table for all videos regardless of source.
-- source = 'admin' (created in /admin/videos/new) | 'qr' (uploaded via
--          /q/[token]) | 'requested' (submitted via /request, normal user)
-- status = 'draft' (admin-only hidden) | 'pending' (awaiting moderation)
--        | 'approved' (publicly visible) | 'rejected' (kept for audit)
-- invite_id is set only when source='qr'; requester_email only for
-- 'requested'.
-- ----------------------------------------------------------------------------
create table public.videos (
  id              uuid primary key default gen_random_uuid(),
  src_type        text not null check (src_type in ('upload', 'youtube')),
  src             text not null,
  thumb           text,
  caption         text not null,
  source          text not null check (source in ('admin', 'qr', 'requested')),
  status          text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  requester_email text,
  invite_id       uuid references public.qr_invites(id) on delete set null,
  display_name    text,
  show_name       boolean not null default false,
  reviewer_notes  text,
  reviewed_by     uuid,
  reviewed_at     timestamptz,
  likes_count     integer not null default 0,
  created_at      timestamptz not null default now(),
  created_by      uuid
);

create index videos_status_created_at_idx
  on public.videos (status, created_at desc);

create index videos_source_status_idx on public.videos (source, status);

-- At most one video per invite (QR submissions).
create unique index videos_one_per_invite_idx
  on public.videos (invite_id) where invite_id is not null;

alter table public.videos enable row level security;

create policy videos_read_approved_public on public.videos
  for select using (status = 'approved');

-- ----------------------------------------------------------------------------
-- messages — canonical table for all text-only contributions. Same
-- source/status semantics as videos.
-- ----------------------------------------------------------------------------
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  text            text not null check (char_length(text) between 1 and 500),
  source          text not null check (source in ('admin', 'qr', 'requested')),
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requester_email text,
  invite_id       uuid references public.qr_invites(id) on delete set null,
  display_name    text,
  show_name       boolean not null default false,
  reviewer_notes  text,
  reviewed_by     uuid,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  created_by      uuid
);

create index messages_status_created_idx
  on public.messages (status, created_at desc);

-- At most one message per invite (QR submissions).
create unique index messages_one_per_invite_idx
  on public.messages (invite_id) where invite_id is not null;

alter table public.messages enable row level security;

create policy messages_read_approved_public on public.messages
  for select using (status = 'approved');

-- ----------------------------------------------------------------------------
-- likes — one row per (video, invite). Anon-invisible; counter on the
-- videos row is maintained by triggers.
-- ----------------------------------------------------------------------------
create table public.likes (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid not null references public.videos(id) on delete cascade,
  invite_id  uuid not null references public.qr_invites(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (video_id, invite_id)
);

create index likes_video_id_idx  on public.likes (video_id);
create index likes_invite_id_idx on public.likes (invite_id);

create or replace function public._inc_video_likes() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  update public.videos
     set likes_count = likes_count + 1
   where id = new.video_id;
  return new;
end;
$$;

create or replace function public._dec_video_likes() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  update public.videos
     set likes_count = greatest(likes_count - 1, 0)
   where id = old.video_id;
  return old;
end;
$$;

create trigger likes_after_insert
  after insert on public.likes
  for each row execute function public._inc_video_likes();

create trigger likes_after_delete
  after delete on public.likes
  for each row execute function public._dec_video_likes();

alter table public.likes enable row level security;
-- No anon policies. Inserted/deleted by /api/q/[token]/like via service role
-- after invite token validation.

-- ----------------------------------------------------------------------------
-- subscribers — opt-in mailing list. unsubscribe_token is the per-row
-- secret used by /unsubscribe/[token].
-- ----------------------------------------------------------------------------
create table public.subscribers (
  id                uuid primary key default gen_random_uuid(),
  email             text not null unique,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  status            text not null default 'active' check (status in ('active', 'unsubscribed')),
  subscribed_at     timestamptz not null default now()
);

create index subscribers_status_idx on public.subscribers (status);

alter table public.subscribers enable row level security;
-- No anon policies. /api/subscribe and /unsubscribe/[token] use service role.
