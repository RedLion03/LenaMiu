import Link from "next/link";
import { Images, MessageCircle } from "lucide-react";

export type GalleryTab = "memories" | "messages";

type Props = {
  active: GalleryTab;
  /** Base path without query string ("/" or "/q/<token>"). */
  basePath: string;
  counts: { memories: number; messages: number };
};

export function GalleryTabs({ active, basePath, counts }: Props) {
  const tabs: {
    key: GalleryTab;
    label: string;
    count: number;
    href: string;
    Icon: typeof Images;
  }[] = [
    {
      key: "memories",
      label: "memories",
      count: counts.memories,
      href: basePath,
      Icon: Images,
    },
    {
      key: "messages",
      label: "messages",
      count: counts.messages,
      href: `${basePath}?tab=messages`,
      Icon: MessageCircle,
    },
  ];

  return (
    <nav className="flex justify-center gap-10">
      {tabs.map(({ key, label, count, href, Icon }) => {
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={href}
            className={`font-display flex items-center gap-2 border-b-2 pb-2 text-2xl transition-colors ${
              isActive
                ? "border-sky-deep text-ink"
                : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            <Icon size={22} strokeWidth={1.5} aria-hidden />
            {label}
            <span className="ml-1 align-top text-[10px] uppercase tracking-widest text-ink-4">
              {count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
