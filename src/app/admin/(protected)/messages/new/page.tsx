import Link from "next/link";
import { NewMessageForm } from "./NewMessageForm";

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

      <NewMessageForm errorParam={error ?? null} />
    </div>
  );
}
