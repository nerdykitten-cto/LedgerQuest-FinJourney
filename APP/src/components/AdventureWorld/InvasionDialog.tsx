interface InvasionDialogProps {
  bossName: string;
  town: string;
  onFight: () => void;
  onEscape: () => void;
}

/** Full-cover TV overlay shown when a chronicle boss has invaded the current town. The player
 *  must choose Fight (→ boss battle) or Escape (→ World Map, town stays locked). Rendered by
 *  AdventureWorld over the town scene while `campaign.invasion` targets this town. */
export function InvasionDialog({ bossName, town, onFight, onEscape }: InvasionDialogProps) {
  return (
    <div className="absolute inset-0 z-[200] bg-[#060d20]/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in-95">
      <div className="w-full max-w-lg bg-[#171f33] border-4 border-[#84231d] p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
        <div className="text-5xl mb-3 animate-pulse">⚠️</div>
        <h3 className="font-headline text-2xl md:text-3xl font-black text-[#ffb4aa] uppercase tracking-tight mb-3">
          {town} Under Siege!
        </h3>
        <p className="font-body text-[#dbe2fd] italic mb-8">
          A <span className="text-[#f4d03f] font-black not-italic">{bossName}</span> has invaded
          {' '}{town} and is wreaking havoc! The townsfolk cry out — what do we do?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onFight}
            className="bg-[#84231d] text-white px-6 py-3 doodle-border font-headline font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">swords</span> We have to fight him!
          </button>
          <button
            onClick={onEscape}
            className="bg-[#171f33] text-[#ffeebb] px-6 py-3 doodle-border border-[#4c4634] font-headline font-black uppercase hover:bg-[#222a3e] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">directions_run</span> We have to escape!
          </button>
        </div>
      </div>
    </div>
  );
}
