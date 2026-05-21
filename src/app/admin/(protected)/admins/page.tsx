import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { ConfirmForm } from "@/components/ConfirmForm";
import { addAdmin, removeAdmin } from "./actions";

type SearchParams = Promise<{
  error?: string;
  just?: string;
  password?: string;
}>;

const ERRORS: Record<string, string> = {
  "invalid email": "That doesn't look like an email.",
  "password-too-short": "Password must be at least 8 characters.",
  "missing-id": "Missing admin id.",
  "cant-remove-self": "You can't remove yourself.",
  "cant-remove-last": "There has to be at least one admin.",
};

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { user } = await requireAdmin();

  const svc = createServiceClient();
  const [{ data: adminRows }, { data: allUsers }] = await Promise.all([
    svc.from("admins").select("user_id, created_at"),
    svc.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const usersById = new Map(
    (allUsers?.users ?? []).map((u) => [u.id, u]),
  );
  const admins = (adminRows ?? []).map((row) => {
    const u = usersById.get(row.user_id);
    return {
      user_id: row.user_id,
      email: u?.email ?? "(missing auth user)",
      created_at: row.created_at,
    };
  });

  const rawError = params.error ? decodeURIComponent(params.error) : null;
  const errorMessage = rawError && (ERRORS[rawError] ?? rawError);
  const justEmail = params.just ? decodeURIComponent(params.just) : null;
  const justPassword = params.password
    ? decodeURIComponent(params.password)
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-medium text-ink">admins</h1>
      <p className="mt-1 text-sm text-ink-2">
        anyone listed here can sign in at <code>/admin/login</code>.
      </p>

      {justEmail && justPassword && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-800">
            admin saved for {justEmail}
          </p>
          <p className="mt-2 text-xs uppercase tracking-widest text-emerald-700">
            password (shown once — copy now)
          </p>
          <code className="mt-1 block break-all rounded-xl bg-white px-4 py-3 font-mono text-sm text-emerald-900 shadow-inner">
            {justPassword}
          </code>
          <p className="mt-3 text-xs text-emerald-700">
            this URL contains the password. close this tab after copying.
          </p>
        </div>
      )}

      {errorMessage && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-xs uppercase tracking-widest text-ink-2">
            <tr>
              <th className="px-4 py-3 text-left">email</th>
              <th className="px-4 py-3 text-left">added</th>
              <th className="px-4 py-3 text-right">actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-ink-3">
                  no admins (this shouldn&apos;t happen — you&apos;re reading this).
                </td>
              </tr>
            )}
            {admins.map((a) => {
              const isSelf = a.user_id === user.id;
              return (
                <tr key={a.user_id} className="border-t border-ink/5">
                  <td className="px-4 py-3">
                    {a.email}
                    {isSelf && (
                      <span className="ml-2 rounded-full bg-sky-light px-2 py-0.5 text-[10px] uppercase tracking-widest text-sky-deep">
                        you
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <ConfirmForm
                        action={removeAdmin}
                        confirm={`remove ${a.email}?`}
                      >
                        <input type="hidden" name="user_id" value={a.user_id} />
                        <button
                          type="submit"
                          disabled={isSelf}
                          aria-label="remove admin"
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-2"
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

      <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg font-medium text-ink">
          add an admin
        </h2>
        <p className="mt-1 text-xs text-ink-2">
          leave password blank to auto-generate. re-adding an existing email
          resets their password.
        </p>
        <form action={addAdmin} className="mt-4 flex flex-col gap-3">
          <div>
            <label
              htmlFor="new-email"
              className="text-xs uppercase tracking-widest text-ink-2"
            >
              email
            </label>
            <input
              id="new-email"
              name="email"
              type="email"
              required
              placeholder="new-admin@example.com"
              className="mt-1 w-full rounded-xl border border-ink/15 bg-cream px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="new-password"
              className="text-xs uppercase tracking-widest text-ink-2"
            >
              password (optional)
            </label>
            <input
              id="new-password"
              name="password"
              type="text"
              minLength={8}
              autoComplete="off"
              placeholder="leave blank to auto-generate"
              className="mt-1 w-full rounded-xl border border-ink/15 bg-cream px-4 py-2 font-mono text-sm text-ink focus:border-sky-dark focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="self-end rounded-full bg-sky px-5 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white"
          >
            add admin
          </button>
        </form>
      </div>
    </div>
  );
}
