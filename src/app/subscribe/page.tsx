import Link from "next/link";
import { GalleryHeader } from "@/components/GalleryHeader";
import { subscribe } from "./actions";

type SearchParams = Promise<{ error?: string; subscribed?: string }>;

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, subscribed } = await searchParams;
  const errorMessage = error ? decodeURIComponent(error) : null;

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
        <h2 className="font-display text-center text-[clamp(2rem,5vw,2.75rem)] font-medium text-ink tracking-[-0.01em] mt-4 mb-10">get new memories in your inbox</h2>
        <p className="-mt-6 mb-8 text-center text-sm italic text-ink-2">
          we&apos;ll email you when a new video joins the gallery. unsubscribe
          anytime.
        </p>

        {subscribed ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="text-lg italic text-emerald-800">
              you&apos;re on the list ✓
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-emerald-700">
              first email arrives with the next new memory.
            </p>
          </div>
        ) : (
          <form action={subscribe} className="flex flex-col gap-3">
            <label
              htmlFor="email"
              className="text-xs uppercase tracking-widest text-ink-2"
            >
              email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
            />
            <button
              type="submit"
              className="mt-2 rounded-full bg-sky px-6 py-2 text-xs uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white"
            >
              subscribe
            </button>
            {errorMessage && (
              <p className="text-center text-sm text-red-600">{errorMessage}</p>
            )}
          </form>
        )}
      </section>
    </>
  );
}
