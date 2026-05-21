import Link from "next/link";

export type GalleryTab = "memories" | "messages";

type Props = {
  active: GalleryTab;
  /** Base path without query string ("/" or "/q/<token>"). */
  basePath: string;
  counts: { memories: number; messages: number };
};

export function GalleryTabs({ active, basePath, counts }: Props) {
  const tabs: { key: GalleryTab; label: string; count: number; href: string }[] = [
    {
      key: "memories",
      label: "memories",
      count: counts.memories,
      href: basePath,
    },
    {
      key: "messages",
      label: "messages",
      count: counts.messages,
      href: `${basePath}?tab=messages`,
    },
  ];

  return (
    <nav className="flex justify-center gap-10">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`font-display border-b-2 pb-2 text-2xl transition-colors ${
              isActive
                ? "border-sky-deep text-ink"
                : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            {t.label}
            <span className="ml-1 align-top text-[10px] uppercase tracking-widest text-ink-4">
              {t.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
