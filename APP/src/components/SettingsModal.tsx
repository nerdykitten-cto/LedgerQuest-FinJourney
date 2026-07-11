interface SettingsModalProps {
  onClose: () => void;
  onResetGame: () => void;
}

/** App settings overlay. Holds the Danger Zone "New Game" reset (moved out of the Grand
 *  Archive → Vaults tab). Room to grow (currency lives in the budget editor, per design). */
export default function SettingsModal({ onClose, onResetGame }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
      <div className="w-full max-w-md relative animate-in zoom-in-95 duration-200">
        <div className="tape-accent doodle-border bg-surface-container p-5 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-2xl font-bold text-primary">Settings</h3>
            <button
              onClick={onClose}
              aria-label="Close settings"
              className="w-9 h-9 rounded-full bg-surface-container-high border-2 border-outline/30 flex items-center justify-center hover:border-primary/50 transition-all"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="border-t-2 border-dashed border-error/30 pt-6">
            <h4 className="font-headline text-lg font-black text-error uppercase">Danger Zone</h4>
            <p className="font-body text-xs text-on-surface-variant italic mb-4">
              Erase ALL progress and start a brand-new game from scratch — the budget gate and
              tutorial are reset.
            </p>
            <button
              onClick={onResetGame}
              className="bg-error text-on-error px-8 py-3 doodle-border font-label text-[10px] uppercase font-black hover:scale-105 transition-transform"
            >
              New Game — Start From Scratch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
