"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-8 text-center">
        <h1 className="font-display text-3xl font-medium text-ink">oh no</h1>
        <p className="mt-4 text-sm text-ink-2">
          something went sideways. try again in a moment.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-[10px] text-ink-3">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-sky px-5 py-2 text-xs uppercase tracking-widest text-ink hover:bg-sky-dark hover:text-white"
          >
            try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-ink/15 px-5 py-2 text-xs uppercase tracking-widest hover:bg-ink/5"
          >
            home
          </Link>
        </div>
      </div>
    </main>
  );
}
