import Link from "next/link";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { thumbForVideo } from "@/lib/media";
import { ConfirmForm } from "@/components/ConfirmForm";
import { deleteVideo, setVideoStatus } from "./actions";

type SearchParams = Promise<{ error?: string; status?: string }>;

type StatusFilter = "all" | "draft" | "pending" | "approved" | "rejected";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-ink/10 text-ink-2",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const SOURCE_TONE: Record<string, string> = {
  qr: "bg-sky-light text-sky-deep",
  requested: "bg-ink/10 text-ink",
  admin: "bg-amber-100 text-amber-800",
};

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filter: StatusFilter =
    params.status === "draft" ||
    params.status === "pending" ||
    params.status === "approved" ||
    params.status === "rejected" ||
    params.status === "all"
      ? params.status
      : "all";

  const { supabase } = await requireAdmin();

  let q = supabase
    .from("videos")
    .select(
      "id, src_type, src, thumb, caption, source, status, requester_email, invite_id, likes_count, created_at",
    )
    .order("created_at", { ascending: false });
  if (filter !== "all") q = q.eq("status", filter);

  const { data: videos, error } = await q;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-medium text-ink">videos</h1>
        <div className="flex items-center gap-3">
          <nav className="flex gap-2 text-xs uppercase tracking-widest">
            {(["all", "pending", "approved", "draft", "rejected"] as const).map(
              (s) => (
                <Link
                  key={s}
                  href={`/admin/videos?status=${s}`}
                  className={`rounded-full px-3 py-1 ${
                    filter === s
                      ? "bg-sky text-ink"
                      : "border border-ink/15 text-ink-2 hover:bg-ink/5"
                  }`}
                >
                  {s}
                </Link>
              ),
            )}
          </nav>
          <Link
            href="/admin/videos/new"
            className="rounded-full bg-sky px-5 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white"
          >
            + new
          </Link>
        </div>
      </div>

      {params.error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {params.error}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-xs uppercase tracking-widest text-ink-2">
            <tr>
              <th className="px-4 py-3 text-left">thumb</th>
              <th className="px-4 py-3 text-left">caption</th>
              <th className="px-4 py-3 text-left">source</th>
              <th className="px-4 py-3 text-left">status</th>
              <th className="px-4 py-3 text-left">likes</th>
              <th className="px-4 py-3 text-right">actions</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-red-700">
                  {error.message}
                </td>
              </tr>
            )}
            {!error && (videos?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-3">
                  nothing here.
                </td>
              </tr>
            )}
            {videos?.map((v) => {
              const thumb = thumbForVideo(v.src_type, v.src, v.thumb);
              return (
                <tr key={v.id} className="border-t border-ink/5">
                  <td className="px-4 py-3">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={v.caption}
                        className="h-12 w-20 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-20 rounded bg-ink/5" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{v.caption}</div>
                    <div className="text-[10px] uppercase tracking-widest text-ink-3">
                      {v.src_type}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 uppercase tracking-widest ${SOURCE_TONE[v.source] ?? ""}`}
                    >
                      {v.source}
                    </span>
                    {v.requester_email && (
                      <div className="mt-1 text-[10px] normal-case text-ink-3">
                        {v.requester_email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-widest ${STATUS_TONE[v.status] ?? ""}`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">{v.likes_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {v.status === "pending" ? (
                        <>
                          <form action={setVideoStatus}>
                            <input type="hidden" name="id" value={v.id} />
                            <input
                              type="hidden"
                              name="status"
                              value="approved"
                            />
                            <button
                              type="submit"
                              className="rounded-full bg-emerald-500 px-3 py-1 text-xs uppercase tracking-widest text-white hover:bg-emerald-600"
                            >
                              approve
                            </button>
                          </form>
                          <form action={setVideoStatus}>
                            <input type="hidden" name="id" value={v.id} />
                            <input
                              type="hidden"
                              name="status"
                              value="rejected"
                            />
                            <button
                              type="submit"
                              className="rounded-full border border-red-200 px-3 py-1 text-xs uppercase tracking-widest text-red-700 hover:bg-red-50"
                            >
                              reject
                            </button>
                          </form>
                        </>
                      ) : (
                        <form action={setVideoStatus}>
                          <input type="hidden" name="id" value={v.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={
                              v.status === "approved" ? "draft" : "approved"
                            }
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-ink/15 px-3 py-1 text-xs uppercase tracking-widest hover:bg-ink/5"
                          >
                            {v.status === "approved" ? "unpublish" : "publish"}
                          </button>
                        </form>
                      )}
                      <Link
                        href={`/admin/videos/${v.id}/edit`}
                        className="rounded-full border border-ink/15 px-3 py-1 text-xs uppercase tracking-widest hover:bg-ink/5"
                      >
                        edit
                      </Link>
                      <ConfirmForm
                        action={deleteVideo}
                        confirm="delete this video?"
                      >
                        <input type="hidden" name="id" value={v.id} />
                        <button
                          type="submit"
                          aria-label="delete"
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-2 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 size={15} strokeWidth={1.75} />
                        </button>
                      </ConfirmForm>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
