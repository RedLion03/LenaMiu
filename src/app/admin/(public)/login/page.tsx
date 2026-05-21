import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { signInWithPassword } from "./actions";

type SearchParams = Promise<{ error?: string }>;

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-email": "That doesn't look like an email.",
  "missing-password": "Password is required.",
  "no-access": "This email isn't authorized.",
  "Invalid login credentials": "Wrong email or password. Try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const ctx = await getCurrentAdmin();
  if (ctx) redirect("/admin");

  const rawError = params.error ? decodeURIComponent(params.error) : null;
  const errorMessage = rawError && (ERROR_MESSAGES[rawError] ?? rawError);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-sky-dark/20 bg-white p-8 shadow-lg">
        <h1 className="font-display text-center text-3xl font-medium text-ink">
          admin
        </h1>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.25em] text-ink-3">
          sign in with email + password
        </p>

        <form action={signInWithPassword} className="mt-6 flex flex-col gap-3">
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
            className="rounded-xl border border-ink/15 bg-cream px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
          />

          <label
            htmlFor="password"
            className="mt-2 text-xs uppercase tracking-widest text-ink-2"
          >
            password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-xl border border-ink/15 bg-cream px-4 py-2 text-ink focus:border-sky-dark focus:outline-none"
          />

          <button
            type="submit"
            className="mt-3 rounded-full bg-sky px-5 py-2 text-sm font-medium uppercase tracking-widest text-ink transition hover:bg-sky-dark hover:text-white"
          >
            sign in
          </button>
        </form>

        {errorMessage && (
          <p className="mt-4 text-center text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    </main>
  );
}
