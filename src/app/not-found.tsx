import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-8 text-center">
        <h1 className="font-display text-3xl font-medium text-ink">not here</h1>
        <p className="mt-4 text-sm text-ink-2">
          this page doesn&apos;t exist anymore — or never did.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-sky px-5 py-2 text-xs uppercase tracking-widest text-ink hover:bg-sky-dark hover:text-white"
        >
          back to gallery
        </Link>
      </div>
    </main>
  );
}
