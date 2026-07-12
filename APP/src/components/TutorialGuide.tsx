import { TUTORIAL_STEPS, TUTORIAL_COPY, type TutorialStep } from '../engine/tutorial';

interface TutorialGuideProps {
  step: TutorialStep;
  onSkip: () => void;
  onAction?: () => void;   // optional jump (e.g. open the relevant tab)
  actionLabel?: string;
}

/** Non-blocking corner card that guides the player through the finance→game loop. Sits above the
 *  demo footer / mobile nav, does not block interaction. AP-emphasis steps get a highlighted rail. */
export default function TutorialGuide({ step, onSkip, onAction, actionLabel }: TutorialGuideProps) {
  const copy = TUTORIAL_COPY[step];
  const idx = TUTORIAL_STEPS.indexOf(step);
  const total = TUTORIAL_STEPS.length - 1; // exclude 'done' from the count
  const isDone = step === 'done';

  return (
    <div className="fixed z-[120] left-3 right-3 bottom-28 md:bottom-6 md:left-6 md:right-auto md:w-80 pointer-events-none">
      <div className={`pointer-events-auto doodle-border bg-surface-container shadow-2xl p-4 animate-in slide-in-from-bottom-4 ${copy.ap ? 'border-l-4 border-l-primary' : ''}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-label text-[9px] uppercase tracking-widest text-primary/80">
            {isDone ? 'Guide complete' : `Guide · Step ${idx + 1}/${total}`}
          </span>
          <button
            onClick={onSkip}
            className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-colors"
          >
            {isDone ? 'Close' : 'Skip guide'}
          </button>
        </div>
        <h4 className="font-headline text-base font-black text-on-surface mb-1">{copy.title}</h4>
        <p className="font-body text-xs text-on-surface-variant leading-snug">{copy.hint}</p>
        {onAction && actionLabel && !isDone && (
          <button
            onClick={onAction}
            className="mt-3 doodle-btn bg-primary text-on-primary px-4 py-1.5 font-headline font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform"
          >
            {actionLabel}
          </button>
        )}
        {isDone && (
          <button
            onClick={onSkip}
            className="mt-3 doodle-btn bg-primary text-on-primary px-4 py-1.5 font-headline font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform"
          >
            Got it!
          </button>
        )}
      </div>
    </div>
  );
}
