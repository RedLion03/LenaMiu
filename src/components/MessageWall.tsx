export type WallMessage = {
  id: string;
  message: string;
  /** Public display name when the author opted in; null = anonymous. */
  author: string | null;
  /** Where the message came from — QR guests get visual emphasis. */
  source: "qr" | "request";
  created_at: string;
};

type Props = {
  messages: WallMessage[];
};

const ROTS = [
  "-1.6deg",
  "0.8deg",
  "-0.6deg",
  "1.4deg",
  "-1.2deg",
  "0.4deg",
  "1deg",
  "-1deg",
];

/**
 * Bento span. We're on a 6-column grid; cards vary between 2, 3, and 4 cols
 * (mobile collapses to 1 col). Longer messages get bigger cards so the text
 * has room to breathe; a couple of indexes get bumped wider for visual
 * rhythm even when short.
 */
function spanFor(message: string, index: number): string {
  const len = message.length;
  if (len > 280) return "sm:col-span-4";
  if (len > 160) return "sm:col-span-3";
  if (index % 5 === 0) return "sm:col-span-3";
  return "sm:col-span-2";
}

export function MessageWall({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <p className="mx-auto max-w-md text-center text-sm italic text-ink-3">
        no messages here yet.
      </p>
    );
  }

  return (
    <div className="grid grid-flow-dense auto-rows-min grid-cols-1 gap-4 sm:grid-cols-6">
      {messages.map((m, i) => {
        const fromGuest = m.source === "qr";
        return (
          <article
            key={m.id}
            className={`relative rounded-2xl p-5 shadow-polaroid transition-transform hover:rotate-0 ${
              fromGuest ? "bg-sky-light" : "bg-white"
            } ${spanFor(m.message, i)}`}
            style={{ transform: `rotate(${ROTS[i % ROTS.length]})` }}
          >
            <blockquote className="font-display whitespace-pre-wrap text-base italic leading-relaxed text-ink sm:text-lg">
              &ldquo;{m.message}&rdquo;
            </blockquote>
            <p className="mt-3 text-[11px] uppercase tracking-widest text-ink-3">
              — {m.author ?? (fromGuest ? "a guest" : "anonymous")}
            </p>
          </article>
        );
      })}
    </div>
  );
}
