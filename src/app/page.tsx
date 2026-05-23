import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchApprovedMessages, fetchQrVideoLabels } from "@/lib/messages";
import { GalleryHeader } from "@/components/GalleryHeader";
import { GalleryTabs, type GalleryTab } from "@/components/GalleryTabs";
import { Gallery } from "@/components/Gallery";
import { MessageWall } from "@/components/MessageWall";
import type { VideoRow } from "@/components/Polaroid";

async function fetchApprovedVideos(): Promise<
  { videos: VideoRow[]; status: "ok" | "unconfigured" | "error" }
> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { videos: [], status: "unconfigured" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select(
      "id, src_type, src, thumb, caption, source, status, requester_email, invite_id, display_name, show_name, reviewer_notes, reviewed_by, reviewed_at, likes_count, recipient, created_at, created_by",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[gallery] failed to fetch approved videos:", error.message);
    return { videos: [], status: "error" };
  }
  return { videos: (data ?? []) as VideoRow[], status: "ok" };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: GalleryTab = tabParam === "messages" ? "messages" : "memories";

  const [{ videos, status }, messages] = await Promise.all([
    fetchApprovedVideos(),
    fetchApprovedMessages(),
  ]);

  const qrVideoIds = videos
    .filter((v) => v.source === "qr")
    .map((v) => v.id);
  const guestLabels: Record<string, string | null> = Object.fromEntries(
    await fetchQrVideoLabels(qrVideoIds),
  );

  return (
    <>
      <GalleryHeader
        actions={
          <>
            <Link href="/request" className="transition-colors hover:text-ink">
              request a memory
            </Link>
            <span aria-hidden className="text-ink-4">
              ·
            </span>
            <Link href="/subscribe" className="transition-colors hover:text-ink">
              subscribe
            </Link>
          </>
        }
      />
      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <GalleryTabs active={tab} basePath="/" counts={{ memories: videos.length, messages: messages.length }} />
        <div className="mt-10">
          {tab === "memories" ? (
            videos.length > 0 ? (
              <Gallery videos={videos} guestLabels={guestLabels} />
            ) : (
              <EmptyState status={status} />
            )
          ) : (
            <MessageWall messages={messages} />
          )}
        </div>
      </section>
      <footer className="px-6 py-10 text-center text-xs uppercase tracking-widest text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          made with
          <Heart
            size={12}
            strokeWidth={1.75}
            className="text-sky-deep"
            aria-hidden
          />
          by Mei
        </span>
      </footer>
    </>
  );
}


function EmptyState({ status }: { status: "ok" | "unconfigured" | "error" }) {
  if (status === "unconfigured") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-sky-dark/30 bg-white/60 p-8 text-center">
        <p className="text-lg text-ink-2">
          Supabase isn&apos;t configured yet.
        </p>
        <p className="mt-2 text-sm text-ink-3">
          Copy <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.example</code> to{" "}
          <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.local</code>, fill in
          the keys, and apply the migration in{" "}
          <code className="rounded bg-ink/5 px-1.5 py-0.5">supabase/migrations/</code>.
        </p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-400/30 bg-white/60 p-8 text-center">
        <p className="text-lg text-ink-2">
          Couldn&apos;t reach the gallery. Try again in a moment.
        </p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-md text-center">
      <p className="text-lg text-ink-2">no memories here yet.</p>
      <p className="mt-2 text-sm text-ink-3">come back soon.</p>
    </div>
  );
}
