import type { Recipient } from "@/lib/supabase/database.types";

export type WallMessage = {
  id: string;
  message: string;
  /** Public display name when the author opted in; null = anonymous. */
  author: string | null;
  /** Where the message came from — QR guests get visual emphasis. */
  source: "qr" | "request";
  /** Who the message is for. Drives the card background colour. */
  recipient: Recipient;
  /** Optional Cloudinary image attachment. */
  imageUrl: string | null;
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
 * QR guests = gold (their own identity). Non-QR uses the recipient field:
 * lena → blue, miu → pink, both → white.
 */
function bgFor(source: WallMessage["source"], recipient: Recipient): string {
  if (source === "qr") return "bg-gold-light";
  if (recipient === "lena") return "bg-sky-light";
  if (recipient === "miu") return "bg-pink-light";
  return "bg-white";
}

export function MessageWall({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <p className="mx-auto max-w-md text-center text-sm italic text-ink-3">
        no messages here yet.
      </p>
    );
  }

  // CSS columns give true masonry: cards size to their content and the
  // column with shorter cards just keeps stacking, so short messages
  // don't get blown up to match a long neighbour. We cap the column count
  // to messages.length so 1–2 messages still fill the row.
  const smCols = Math.min(messages.length, 2);
  const xlCols = Math.min(messages.length, 3);
  const colsClass = [
    "columns-1",
    smCols >= 2 ? "sm:columns-2" : "",
    xlCols >= 3 ? "lg:columns-3" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${colsClass} gap-4`}>
      {messages.map((m, i) => {
        const fromGuest = m.source === "qr";
        return (
          <article
            key={m.id}
            className={`relative mb-4 block w-full break-inside-avoid rounded-2xl p-5 shadow-polaroid transition-transform hover:rotate-0 ${bgFor(
              m.source,
              m.recipient,
            )}`}
            style={{ transform: `rotate(${ROTS[i % ROTS.length]})` }}
          >
            <blockquote className="font-display whitespace-pre-wrap text-base italic leading-relaxed text-ink sm:text-lg">
              &ldquo;{m.message}&rdquo;
            </blockquote>
            {m.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.imageUrl}
                alt="attachment"
                className="mt-3 w-full rounded-xl object-cover"
                loading="lazy"
              />
            )}
            <p className="mt-3 text-[11px] uppercase tracking-widest text-ink-3">
              — {m.author ?? (fromGuest ? "a guest" : "anonymous")}
            </p>
          </article>
        );
      })}
    </div>
  );
}
