import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();

  const [
    videosTotal,
    videosPending,
    messagesTotal,
    messagesPending,
    invites,
    admins,
  ] = await Promise.all([
    supabase.from("videos").select("id", { count: "exact", head: true }),
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("qr_invites")
      .select("id", { count: "exact", head: true })
      .is("revoked_at", null),
    supabase.from("admins").select("user_id", { count: "exact", head: true }),
  ]);

  const cards = [
    {
      href: "/admin/videos",
      label: "videos",
      count: videosTotal.count ?? 0,
    },
    {
      href: "/admin/videos?status=pending",
      label: "videos · pending",
      count: videosPending.count ?? 0,
    },
    {
      href: "/admin/messages",
      label: "messages",
      count: messagesTotal.count ?? 0,
    },
    {
      href: "/admin/messages?status=pending",
      label: "messages · pending",
      count: messagesPending.count ?? 0,
    },
    {
      href: "/admin/invites",
      label: "active invites",
      count: invites.count ?? 0,
    },
    { href: "/admin/admins", label: "admins", count: admins.count ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-medium text-ink">overview</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-end justify-between rounded-2xl border border-ink/10 bg-white p-6 transition hover:border-sky-dark hover:shadow-md"
          >
            <span className="text-xs uppercase tracking-widest text-ink-2">
              {card.label}
            </span>
            <span className="font-display text-4xl font-medium text-sky-deep">
              {card.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
