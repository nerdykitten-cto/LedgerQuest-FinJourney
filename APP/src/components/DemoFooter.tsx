/** Persistent low-key strip on every page: this is a demo, not a real financial tool, and a
 *  PixelOre product. Muted gray, non-interactive. Sits in normal flow at the bottom of the
 *  page; App adds bottom margin on mobile so the floating nav clears it. */
export default function DemoFooter() {
  return (
    <div className="w-full border-t-2 border-outline-variant/40 bg-surface-container-low/60 px-4 py-2 text-center select-none">
      <p className="font-label text-[9px] md:text-[10px] uppercase tracking-widest text-on-surface-variant/70">
        DEMO — not a real financial tool <span className="italic normal-case tracking-normal">(yet)</span>
        <span className="mx-2 opacity-40">·</span>
        A <span className="text-primary/70 font-black">PixelOre</span> product
      </p>
    </div>
  );
}
