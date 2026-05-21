"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

/**
 * Modal on desktop (centered, capped width); sheet on mobile (anchored to the
 * bottom, full-width, rounded top). Esc and backdrop click both close it.
 */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[800] flex items-end justify-center bg-black/45 animate-fade-in md:items-center"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-cream animate-pop-in md:max-h-[85vh] md:max-w-xl md:rounded-3xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          {title ? (
            <h2 className="font-display text-xl font-medium text-ink">{title}</h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
