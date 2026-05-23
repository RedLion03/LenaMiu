import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { RecipientField } from "@/components/RecipientField";
import { SubmitButton } from "@/components/SubmitButton";
import { updateVideo } from "../../actions";

type RouteParams = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function EditVideoPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { error: errParam } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: video, error } = await supabase
    .from("videos")
    .select(
      "id, caption, status, src_type, src, source, requester_email, recipient",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return <p className="text-red-700">{error.message}</p>;
  }
  if (!video) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/videos"
        className="text-xs uppercase tracking-widest text-ink-2 hover:text-ink"
      >
        ← back to videos
      </Link>
      <h1 className="mt-4 font-display text-3xl font-medium text-ink">
        edit video
      </h1>
      <p className="mt-1 text-xs uppercase tracking-widest text-ink-3">
        {video.src_type} · {video.source}
        {video.requester_email ? ` · ${video.requester_email}` : ""}
      </p>

      <form action={updateVideo} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="id" value={video.id} />
        <div>
          <label
            htmlFor="caption"
            className="text-xs uppercase tracking-widest text-ink-2"
          >
            caption
          </label>
          <input
            id="caption"
            name="caption"
            type="text"
            required
            maxLength={25}
            defaultValue={video.caption}
            className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
          />
        </div>
        <RecipientField defaultValue={video.recipient ?? "both"} />
        <div>
          <label
            htmlFor="status"
            className="text-xs uppercase tracking-widest text-ink-2"
          >
            status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={video.status}
            className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
          >
            <option value="approved">approved (visible)</option>
            <option value="pending">pending</option>
            <option value="rejected">rejected (hidden)</option>
            <option value="draft">draft (hidden)</option>
          </select>
        </div>

        {errParam && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
            {errParam}
          </p>
        )}

        <SubmitButton
          pendingLabel="saving…"
          className="self-start rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white disabled:cursor-wait disabled:opacity-70"
        >
          save changes
        </SubmitButton>
      </form>
    </div>
  );
}
