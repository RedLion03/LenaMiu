import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  createInvite,
  deleteInvite,
  revokeInvite,
  unrevokeInvite,
} from "./actions";

type SearchParams = Promise<{ error?: string }>;

type InviteRow = {
  id: string;
  token: string;
  label: string | null;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

function inviteStatus(
  invite: InviteRow,
  used: boolean,
): { label: string; tone: "active" | "used" | "revoked" } {
  if (invite.revoked_at) return { label: "revoked", tone: "revoked" };
  if (used) return { label: "used", tone: "used" };
  return { label: "active", tone: "active" };
}

export default async function AdminInvitesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();

  const [
    { data: invites, error },
    { data: msgInvites },
    { data: vidInvites },
  ] = await Promise.all([
    supabase
      .from("qr_invites")
      .select("id, token, label, used_at, revoked_at, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("messages").select("invite_id").not("invite_id", "is", null),
    supabase.from("videos").select("invite_id").not("invite_id", "is", null),
  ]);

  const rows = (invites ?? []) as InviteRow[];
  const usedInviteIds = new Set<string>([
    ...(msgInvites ?? [])
      .map((m) => m.invite_id)
      .filter((x): x is string => !!x),
    ...(vidInvites ?? [])
      .map((v) => v.invite_id)
      .filter((x): x is string => !!x),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-medium text-ink">invites</h1>
        <form action={createInvite} className="flex items-end gap-2">
          <label className="flex flex-col text-xs uppercase tracking-widest text-ink-2">
            label (optional)
            <input
              name="label"
              type="text"
              maxLength={80}
              placeholder="for: tia bia"
              className="mt-1 rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-sm normal-case tracking-normal text-ink focus:border-sky-dark focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-sky px-5 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white"
          >
            + new invite
          </button>
        </form>
      </div>

      {(params.error || error) && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {params.error ?? error?.message}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-xs uppercase tracking-widest text-ink-2">
            <tr>
              <th className="px-4 py-3 text-left">label</th>
              <th className="px-4 py-3 text-left">status</th>
              <th className="px-4 py-3 text-left">created</th>
              <th className="px-4 py-3 text-left">share link</th>
              <th className="px-4 py-3 text-right">actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-3">
                  no invites yet — create one to share.
                </td>
              </tr>
            )}
            {rows.map((inv) => {
              const isUsed = usedInviteIds.has(inv.id);
              const status = inviteStatus(inv, isUsed);
              return (
                <tr key={inv.id} className="border-t border-ink/5">
                  <td className="px-4 py-3 font-medium">
                    {inv.label ?? <span className="text-ink-4">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-widest ${
                        status.tone === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : status.tone === "used"
                            ? "bg-sky-light text-sky-deep"
                            : "bg-ink/10 text-ink-2"
                      }`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/invites/${inv.id}`}
                      className="text-xs uppercase tracking-widest text-sky-deep hover:underline"
                    >
                      view QR ↗
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <form
                        action={inv.revoked_at ? unrevokeInvite : revokeInvite}
                      >
                        <input type="hidden" name="id" value={inv.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-ink/15 px-3 py-1 text-xs uppercase tracking-widest hover:bg-ink/5"
                        >
                          {inv.revoked_at ? "unrevoke" : "revoke"}
                        </button>
                      </form>
                      <form action={deleteInvite}>
                        <input type="hidden" name="id" value={inv.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-red-200 px-3 py-1 text-xs uppercase tracking-widest text-red-700 hover:bg-red-50"
                        >
                          delete
                        </button>
                      </form>
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
