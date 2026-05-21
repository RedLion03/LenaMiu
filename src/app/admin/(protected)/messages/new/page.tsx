import Link from "next/link";
import { createMessage } from "../actions";

type SearchParams = Promise<{ error?: string }>;

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/messages"
        className="text-xs uppercase tracking-widest text-ink-2 hover:text-ink"
      >
        ← back to messages
      </Link>
      <h1 className="mt-4 font-display text-3xl font-medium text-ink">
        new message
      </h1>
      <p className="mt-1 text-sm text-ink-2">
        admin-authored messages are saved as approved and appear in the wall
        immediately.
      </p>

      <form action={createMessage} className="mt-6 flex flex-col gap-4">
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
            placeholder="say something nice…"
            className="mt-1 w-full resize-none rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink focus:border-sky-dark focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="displayName"
            className="text-xs uppercase tracking-widest text-ink-2"
          >
            display name (optional)
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            maxLength={40}
            placeholder="how it'll appear publicly"
            className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            name="showName"
            className="size-4 accent-sky-dark"
          />
          show the name publicly
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
            {decodeURIComponent(error)}
          </p>
        )}

        <button
          type="submit"
          className="self-start rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white"
        >
          publish
        </button>
      </form>
    </div>
  );
}
