import type { ReactNode } from "react";

type Props = {
  /** Inline actions rendered on the cream curve at the bottom of the header. */
  actions?: ReactNode;
};

export function GalleryHeader({ actions }: Props) {
  return (
    <header className="relative bg-sky px-8 pt-10 pb-16 text-center">
      <div className="font-script leading-none text-white text-[clamp(3.5rem,10vw,5.5rem)] [text-shadow:3px_4px_0_rgba(0,0,0,0.1)]">
        LenaMiu
      </div>
      <div className="mt-1 text-xs uppercase tracking-[0.3em] text-white/92">
        my little corner
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 -bottom-px h-[45px] bg-cream [clip-path:ellipse(55%_100%_at_50%_100%)]"
      ></div>
      {actions && (
        <div className="absolute inset-x-0 bottom-2 z-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs uppercase tracking-widest text-ink-2">
          {actions}
        </div>
      )}
    </header>
  );
}
