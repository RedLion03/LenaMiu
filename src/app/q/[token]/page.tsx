import { validateInviteToken } from "@/lib/invite";
import { thumbForVideo } from "@/lib/media";
import { fetchApprovedMessages, fetchQrVideoLabels } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { GalleryHeader } from "@/components/GalleryHeader";
import { GalleryTabs, type GalleryTab } from "@/components/GalleryTabs";
import { Gallery } from "@/components/Gallery";
import { MessageWall } from "@/components/MessageWall";
import { QrLeaveTrigger } from "./QrLeaveTrigger";
import type { VideoRow } from "@/components/Polaroid";

type RouteParams = Promise<{ token: string }>;
type SearchParams = Promise<{
  error?: string;
  submitted?: string;
  removed?: string;
  tab?: string;
}>;

export default async function QrLandingPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { token } = await params;
  const {
    error: errorParam,
    submitted,
    removed,
    tab: tabParam,
  } = await searchParams;
  const tab: GalleryTab = tabParam === "messages" ? "messages" : "memories";

  const invite = await validateInviteToken(token);
  if (!invite) return <InvalidInvite />;

  // All QR forms post the token back as a hidden field; there's no
  // navigation away from /q/[token] yet, so no cookie is needed. If we
  // later add cross-page QR navigation, set the cookie from middleware
  // (proxy.ts) — server components can't mutate cookies.

  const supabase = await createClient();
  const svc = createServiceClient();

  const [
    { data: videos },
    messages,
    { data: myVideo },
    { data: myMessage },
    { data: likes },
  ] = await Promise.all([
    supabase
      .from("videos")
      .select(
        "id, src_type, src, thumb, caption, source, status, requester_email, invite_id, display_name, show_name, reviewer_notes, reviewed_by, reviewed_at, likes_count, recipient, created_at, created_by",
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    fetchApprovedMessages(),
    svc
      .from("videos")
      .select("status, caption, src_type, src, thumb, recipient")
      .eq("invite_id", invite.id)
      .maybeSingle(),
    svc
      .from("messages")
      .select("status, text, recipient, image_url")
      .eq("invite_id", invite.id)
      .maybeSingle(),
    svc.from("likes").select("video_id").eq("invite_id", invite.id),
  ]);

  type SlotStatus = "pending" | "approved" | "rejected";

  const existing = {
    message: myMessage
      ? {
          status: myMessage.status as SlotStatus,
          text: myMessage.text,
          recipient: myMessage.recipient ?? "both",
          image_url: myMessage.image_url ?? null,
        }
      : null,
    video: myVideo
      ? {
          status: myVideo.status as SlotStatus,
          caption: myVideo.caption,
          thumb: thumbForVideo(myVideo.src_type, myVideo.src, myVideo.thumb),
          src_type: myVideo.src_type,
          recipient: myVideo.recipient ?? "both",
        }
      : null,
  };

  const myLikedIds = (likes ?? []).map((l) => l.video_id);

  const qrVideoIds = (videos ?? [])
    .filter((v) => v.source === "qr")
    .map((v) => v.id);
  const guestLabels: Record<string, string | null> = Object.fromEntries(
    await fetchQrVideoLabels(qrVideoIds),
  );

  return (
    <>
      <GalleryHeader
        actions={
          <QrLeaveTrigger
            token={token}
            errorParam={errorParam ?? null}
            submitted={
              submitted === "message" || submitted === "video"
                ? submitted
                : null
            }
            removedSlot={
              removed === "message" || removed === "video" ? removed : null
            }
            existing={existing}
          />
        }
      />
      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <GalleryTabs
          active={tab}
          basePath={`/q/${token}`}
          counts={{ memories: videos?.length ?? 0, messages: messages.length }}
        />
        <div className="mt-10">
          {tab === "memories" ? (
            videos && videos.length > 0 ? (
              <Gallery
                videos={videos as VideoRow[]}
                qrToken={token}
                myLikedIds={myLikedIds}
                guestLabels={guestLabels}
              />
            ) : (
              <p className="text-center text-ink-3">no memories yet.</p>
            )
          ) : (
            <MessageWall messages={messages} />
          )}
        </div>
      </section>
      <footer className="px-6 py-10 text-center text-xs uppercase tracking-widest text-ink-3">
        invited as{" "}
        <span className="normal-case text-ink-2">{invite.label ?? "guest"}</span>
      </footer>
    </>
  );
}

function InvalidInvite() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-8 text-center">
        <h1 className="font-script text-5xl leading-none text-sky-deep">
          LenaMiu
        </h1>
        <p className="mt-4 text-sm text-ink-2">
          this invite link isn&apos;t valid anymore.
        </p>
        <p className="mt-2 text-xs uppercase tracking-widest text-ink-3">
          ask whoever invited you for a fresh link.
        </p>
      </div>
    </main>
  );
}
