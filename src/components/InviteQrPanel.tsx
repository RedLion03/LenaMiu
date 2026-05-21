"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  url: string;
  label: string | null;
};

export function InviteQrPanel({ url, label }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore — older browsers / blocked clipboard.
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-ink/10 bg-white p-8">
      <p className="font-display text-2xl font-medium text-ink">
        {label ?? "invite"}
      </p>
      <QRCodeCanvas
        value={url}
        size={240}
        bgColor="#ffffff"
        fgColor="#1a1a2e"
        level="H"
      />
      <div className="w-full">
        <div className="font-mono text-[10px] break-all text-ink-2">{url}</div>
        <button
          type="button"
          onClick={copy}
          className="mt-3 w-full rounded-full border border-ink/15 px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink/5"
        >
          {copied ? "copied!" : "copy link"}
        </button>
      </div>
    </div>
  );
}
