import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { signOut } from "./actions";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-ink/10 bg-white px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-script text-3xl leading-none text-sky-deep">
              LenaMiu
            </span>
            <span className="text-xs uppercase tracking-[0.25em] text-ink-3">
              admin
            </span>
          </Link>
          <nav className="hidden gap-4 text-xs uppercase tracking-widest text-ink-2 sm:flex">
            <Link href="/admin/videos" className="hover:text-ink">
              videos
            </Link>
            <Link href="/admin/messages" className="hover:text-ink">
              messages
            </Link>
            <Link href="/admin/invites" className="hover:text-ink">
              invites
            </Link>
            <Link href="/admin/admins" className="hover:text-ink">
              admins
            </Link>
            <Link href="/" className="hover:text-ink">
              gallery ↗
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-2">
          <span className="hidden sm:inline">{user.email}</span>
          <form action={signOut}>
            <SubmitButton
              pendingLabel="signing out…"
              className="rounded-full border border-ink/15 px-3 py-1 uppercase tracking-widest hover:bg-ink/5 disabled:cursor-wait disabled:opacity-70"
            >
              sign out
            </SubmitButton>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
