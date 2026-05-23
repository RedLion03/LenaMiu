import Link from "next/link";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { ConfirmForm } from "@/components/ConfirmForm";
import { SubmitButton } from "@/components/SubmitButton";
import { deleteMessage, setMessageStatus } from "./actions";

type SearchParams = Promise<{ error?: string; status?: string }>;

type StatusFilter = "pending" | "approved" | "rejected" | "all";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const SOURCE_TONE: Record<string, string> = {
  qr: "bg-sky-light text-sky-deep",
  request: "bg-ink/10 text-ink",
  admin: "bg-amber-100 text-amber-800",
};

const SOURCE_LABEL: Record<string, string> = {
  qr: "qr guest",
  request: "request",
  admin: "admin",
};

const RECIPIENT_TONE: Record<string, string> = {
  lena: "bg-sky-light text-sky-deep",
  miu: "bg-pink-light text-pink-deep",
  both: "bg-ink/5 text-ink-2",
};

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filter: StatusFilter =
    params.status === "approved" ||
    params.status === "pending" ||
    params.status === "rejected" ||
    params.status === "all"
      ? params.status
      : "all";

  const { supabase } = await requireAdmin();

  let q = supabase
    .from("messages")
    .select(
      "id, text, source, status, display_name, show_name, requester_email, recipient, image_url, created_at",
    )
    .order("created_at", { ascending: false });
  if (filter !== "all") q = q.eq("status", filter);

  const { data: rows, error } = await q;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-medium text-ink">messages</h1>
        <div className="flex items-center gap-3">
          <nav className="flex gap-2 text-xs uppercase tracking-widest">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <Link
                key={s}
                href={`/admin/messages?status=${s}`}
                className={`rounded-full px-3 py-1 ${
                  filter === s
                    ? "bg-sky text-ink"
                    : "border border-ink/15 text-ink-2 hover:bg-ink/5"
                }`}
              >
                {s}
              </Link>
            ))}
          </nav>
          <Link
            href="/admin/messages/new"
            className="rounded-full bg-sky px-5 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white"
          >
            + new
          </Link>
        </div>
      </div>

      {(params.error || error) && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {params.error ? decodeURIComponent(params.error) : error?.message}
        </p>
      )}

      <div className="mt-8 grid gap-3">
        {(rows ?? []).length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-8 text-center text-ink-3">
            nothing here.
          </p>
        )}
        {(rows ?? []).map((r) => (
          <article
            key={r.id}
            className="rounded-2xl border border-ink/10 bg-white p-5"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-ink-2">
              <span
                className={`rounded-full px-2 py-0.5 ${SOURCE_TONE[r.source] ?? ""}`}
              >
                {SOURCE_LABEL[r.source] ?? r.source}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 ${STATUS_TONE[r.status] ?? ""}`}
              >
                {r.status}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 ${RECIPIENT_TONE[r.recipient] ?? ""}`}
              >
                for {r.recipient}
              </span>
              <span>{new Date(r.created_at).toLocaleString()}</span>
              {r.requester_email && (
                <span className="normal-case text-ink-3">
                  {r.requester_email}
                </span>
              )}
            </div>
            <blockquote className="mt-3 whitespace-pre-wrap border-l-2 border-sky pl-3 text-sm italic text-ink">
              {r.text}
            </blockquote>
            {r.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.image_url}
                alt="attachment"
                className="mt-3 max-h-72 rounded-xl object-cover"
              />
            )}
            {r.display_name && (
              <p className="mt-2 text-xs text-ink-3">
                — {r.display_name}{" "}
                <span className="text-ink-4">
                  ({r.show_name ? "public" : "hidden"})
                </span>
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              {r.status === "pending" ? (
                <div className="flex gap-2">
                  <form action={setMessageStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="approved" />
                    <SubmitButton
                      pendingLabel="approving…"
                      className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs uppercase tracking-widest text-white hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-70"
                    >
                      approve
                    </SubmitButton>
                  </form>
                  <form action={setMessageStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <SubmitButton
                      pendingLabel="rejecting…"
                      className="rounded-full border border-red-200 px-4 py-1.5 text-xs uppercase tracking-widest text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-70"
                    >
                      reject
                    </SubmitButton>
                  </form>
                </div>
              ) : (
                <span />
              )}
              <div className="flex gap-1">
                <Link
                  href={`/admin/messages/${r.id}/edit`}
                  aria-label="edit"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-2 hover:bg-ink/5 hover:text-ink"
                >
                  <Pencil size={15} strokeWidth={1.75} />
                </Link>
                <ConfirmForm
                  action={deleteMessage}
                  confirm="delete this message?"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <SubmitButton
                    aria-label="delete"
                    pendingContent={
                      <Loader2 size={15} strokeWidth={1.75} className="animate-spin" />
                    }
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-2 hover:bg-red-50 hover:text-red-700 disabled:cursor-wait"
                  >
                    <Trash2 size={15} strokeWidth={1.75} />
                  </SubmitButton>
                </ConfirmForm>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
