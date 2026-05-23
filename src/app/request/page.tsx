import Link from "next/link";
import { GalleryHeader } from "@/components/GalleryHeader";
import { RequestForm } from "./RequestForm";

type SearchParams = Promise<{ error?: string; submitted?: string }>;

export default async function RequestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, submitted } = await searchParams;

  return (
    <>
      <GalleryHeader />
      <section className="mx-auto w-full max-w-xl px-6 py-12">
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-ink-2 hover:text-ink"
        >
          ← back to gallery
        </Link>
        <h2 className="font-display text-center text-[clamp(2rem,5vw,2.75rem)] font-medium text-ink tracking-[-0.01em] mt-4 mb-10">share something</h2>
        <p className="-mt-6 mb-8 text-center text-sm italic text-ink-2">
          suggest a video/image or send a message — we&apos;ll review before it
          joins the gallery.
        </p>

        {submitted === "video" || submitted === "message" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="text-lg italic text-emerald-800">
              thanks — your {submitted} is waiting for review.
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-emerald-700">
              we&apos;ll email you when it&apos;s approved.
            </p>
            <Link
              href="/request"
              className="mt-4 inline-block text-xs uppercase tracking-widest text-sky-deep hover:underline"
            >
              submit another
            </Link>
          </div>
        ) : (
          <RequestForm errorParam={error ?? null} />
        )}
      </section>
    </>
  );
}
