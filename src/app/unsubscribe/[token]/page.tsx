import Link from "next/link";
import { GalleryHeader } from "@/components/GalleryHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { createServiceClient } from "@/lib/supabase/service";
import { confirmUnsubscribe } from "./actions";

type RouteParams = Promise<{ token: string }>;
type SearchParams = Promise<{ done?: string; error?: string }>;

async function lookupSubscriber(token: string) {
  let svc: ReturnType<typeof createServiceClient>;
  try {
    svc = createServiceClient();
  } catch {
    return null;
  }
  const { data } = await svc
    .from("subscribers")
    .select("email, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  return data;
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { token } = await params;
  const { done, error } = await searchParams;

  const subscriber = await lookupSubscriber(token);

  return (
    <>
      <GalleryHeader />
      <section className="mx-auto w-full max-w-md px-6 py-12">
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-ink-2 hover:text-ink"
        >
          ← back to gallery
        </Link>
        <h2 className="font-display text-center text-[clamp(2rem,5vw,2.75rem)] font-medium text-ink tracking-[-0.01em] mt-4 mb-10">unsubscribe</h2>

        {!subscriber ? (
          <div className="rounded-2xl border border-ink/10 bg-white p-6 text-center">
            <p className="text-sm italic text-ink-2">
              this link isn&apos;t valid or has already been used.
            </p>
          </div>
        ) : done ? (
          <div className="rounded-2xl border border-ink/10 bg-white p-6 text-center">
            <p className="text-lg italic text-ink">
              you&apos;re unsubscribed.
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-ink-3">
              {subscriber.email}
            </p>
            <Link
              href="/subscribe"
              className="mt-4 inline-block text-xs uppercase tracking-widest text-sky-deep hover:underline"
            >
              changed your mind? subscribe again
            </Link>
          </div>
        ) : subscriber.status === "unsubscribed" ? (
          <div className="rounded-2xl border border-ink/10 bg-white p-6 text-center">
            <p className="text-sm italic text-ink-2">
              <span className="font-medium">{subscriber.email}</span> is already
              unsubscribed.
            </p>
            <Link
              href="/subscribe"
              className="mt-4 inline-block text-xs uppercase tracking-widest text-sky-deep hover:underline"
            >
              subscribe again
            </Link>
          </div>
        ) : (
          <form
            action={confirmUnsubscribe}
            className="rounded-2xl border border-ink/10 bg-white p-6 text-center"
          >
            <input type="hidden" name="token" value={token} />
            <p className="text-sm text-ink-2">
              unsubscribe{" "}
              <span className="font-medium">{subscriber.email}</span> from new
              memory emails?
            </p>
            <SubmitButton
              pendingLabel="unsubscribing…"
              className="mt-6 rounded-full border border-ink/15 px-6 py-2 text-xs uppercase tracking-widest hover:bg-ink/5 disabled:cursor-wait disabled:opacity-70"
            >
              confirm unsubscribe
            </SubmitButton>
            {error && (
              <p className="mt-3 text-sm text-red-600">
                {decodeURIComponent(error)}
              </p>
            )}
          </form>
        )}
      </section>
    </>
  );
}
