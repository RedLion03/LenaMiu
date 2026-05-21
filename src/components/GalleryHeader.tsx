export function GalleryHeader() {
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
      />
    </header>
  );
}
