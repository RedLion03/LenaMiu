import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { EditMessageForm } from "./EditMessageForm";

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
    .select(
      "id, text, display_name, show_name, status, source, recipient, image_url",
    )
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

      <EditMessageForm
        id={id}
        text={row.text}
        displayName={row.display_name}
        showName={row.show_name}
        status={row.status}
        recipient={row.recipient ?? "both"}
        imageUrl={row.image_url}
        errorParam={errorParam ?? null}
      />
    </div>
  );
}
