import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { InviteQrPanel } from "@/components/InviteQrPanel";
import { SubmitButton } from "@/components/SubmitButton";
import { revokeInvite, unrevokeInvite, deleteInvite } from "../actions";

type RouteParams = Promise<{ id: string }>;

async function detectOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("host");
  if (!host) return "http://localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function InviteDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [
    { data: invite, error },
    { data: message },
    { data: video },
  ] = await Promise.all([
    supabase
      .from("qr_invites")
      .select("id, token, label, revoked_at, used_at, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, status, text")
      .eq("invite_id", id)
      .maybeSingle(),
    supabase
      .from("videos")
      .select("id, status, caption")
      .eq("invite_id", id)
      .maybeSingle(),
  ]);

  if (error) {
    return <p className="text-red-700">{error.message}</p>;
  }
  if (!invite) notFound();

  const origin = await detectOrigin();
  const shareUrl = `${origin}/q/${invite.token}`;
  const used = Boolean(message || video);

  const status = invite.revoked_at ? "revoked" : used ? "used" : "active";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/invites"
        className="text-xs uppercase tracking-widest text-ink-2 hover:text-ink"
      >
        ← back to invites
      </Link>

      <div className="mt-4 flex items-end justify-between">
        <h1 className="font-display text-3xl font-medium text-ink">
          {invite.label ?? "invite"}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest ${
            status === "active"
              ? "bg-emerald-100 text-emerald-700"
              : status === "used"
                ? "bg-sky-light text-sky-deep"
                : "bg-ink/10 text-ink-2"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <InviteQrPanel url={shareUrl} label={invite.label} />

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-6">
            <h2 className="text-xs uppercase tracking-widest text-ink-2">
              created
            </h2>
            <p className="mt-1 text-sm">
              {new Date(invite.created_at).toLocaleString()}
            </p>
            <h2 className="mt-4 text-xs uppercase tracking-widest text-ink-2">
              token
            </h2>
            <p className="mt-1 break-all font-mono text-[11px] text-ink-2">
              {invite.token}
            </p>
          </div>

          {message && (
            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <h2 className="text-xs uppercase tracking-widest text-ink-2">
                message · {message.status}
              </h2>
              <blockquote className="mt-3 whitespace-pre-wrap border-l-2 border-sky pl-3 text-sm italic text-ink-2">
                {message.text}
              </blockquote>
              <Link
                href={`/admin/messages/${message.id}/edit`}
                className="mt-3 inline-block text-xs uppercase tracking-widest text-sky-deep hover:underline"
              >
                review ↗
              </Link>
            </div>
          )}

          {video && (
            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <h2 className="text-xs uppercase tracking-widest text-ink-2">
                video · {video.status}
              </h2>
              <p className="mt-2 text-sm">{video.caption}</p>
              <Link
                href={`/admin/videos/${video.id}/edit`}
                className="mt-3 inline-block text-xs uppercase tracking-widest text-sky-deep hover:underline"
              >
                review ↗
              </Link>
            </div>
          )}

          {!message && !video && (
            <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-6 text-center text-sm text-ink-3">
              the recipient hasn&apos;t submitted yet.
            </div>
          )}

          <div className="flex gap-2">
            <form action={invite.revoked_at ? unrevokeInvite : revokeInvite}>
              <input type="hidden" name="id" value={invite.id} />
              <SubmitButton
                pendingLabel="…"
                className="rounded-full border border-ink/15 px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink/5 disabled:cursor-wait disabled:opacity-70"
              >
                {invite.revoked_at ? "unrevoke" : "revoke"}
              </SubmitButton>
            </form>
            <form action={deleteInvite}>
              <input type="hidden" name="id" value={invite.id} />
              <SubmitButton
                pendingLabel="…"
                className="rounded-full border border-red-200 px-4 py-2 text-xs uppercase tracking-widest text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-70"
              >
                delete
              </SubmitButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
