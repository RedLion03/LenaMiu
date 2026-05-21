import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { updateMessage } from "../../actions";

type RouteParams = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function EditMessagePage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { error: errorParam } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: row, error } = await supabase
    .from("messages")
    .select("id, text, display_name, show_name, status, source")
    .eq("id", id)
    .maybeSingle();

  if (error) return <p className="text-red-700">{error.message}</p>;
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/messages"
        className="text-xs uppercase tracking-widest text-ink-2 hover:text-ink"
      >
        ← back to messages
      </Link>
      <h1 className="mt-4 font-display text-3xl font-medium text-ink">
        edit message
      </h1>
      <p className="mt-1 text-xs uppercase tracking-widest text-ink-3">
        source: {row.source}
      </p>

      <form action={updateMessage} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="id" value={id} />

        <div>
          <label
            htmlFor="text"
            className="text-xs uppercase tracking-widest text-ink-2"
          >
            message
          </label>
          <textarea
            id="text"
            name="text"
            required
            minLength={1}
            maxLength={500}
            rows={5}
            defaultValue={row.text ?? ""}
            className="mt-1 w-full resize-none rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink focus:border-sky-dark focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="displayName"
            className="text-xs uppercase tracking-widest text-ink-2"
          >
            display name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            maxLength={40}
            defaultValue={row.display_name ?? ""}
            className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            name="showName"
            defaultChecked={row.show_name}
            className="size-4 accent-sky-dark"
          />
          show the name publicly
        </label>

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
            defaultValue={row.status}
            className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
          >
            <option value="approved">approved (visible)</option>
            <option value="pending">pending</option>
            <option value="rejected">rejected (hidden)</option>
          </select>
        </div>

        {errorParam && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
            {decodeURIComponent(errorParam)}
          </p>
        )}

        <button
          type="submit"
          className="self-start rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white"
        >
          save changes
        </button>
      </form>
    </div>
  );
}
