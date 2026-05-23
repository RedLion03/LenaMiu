import Link from "next/link";
import { NewVideoForm } from "./NewVideoForm";

type SearchParams = Promise<{ error?: string }>;

export default async function NewVideoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/videos"
        className="text-xs uppercase tracking-widest text-ink-2 hover:text-ink"
      >
        ← back to videos
      </Link>
      <h1 className="mt-4 font-display text-3xl font-medium text-ink">
        new video/image
      </h1>
      <p className="mt-1 text-sm text-ink-2">
        paste a YouTube link or upload a video/image from your device.
      </p>

      <NewVideoForm errorParam={error ?? null} />
    </div>
  );
}
