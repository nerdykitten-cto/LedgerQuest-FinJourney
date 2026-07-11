import type { OnboardingStep } from '../engine/onboarding';

interface OnboardingGateProps {
  /** Current gate step — 'set-budget' or 'log-expense' (never rendered at 'complete'). */
  step: OnboardingStep;
  onSetBudget: () => void;
  onGoLog: () => void;
}

/**
 * Budget-first onboarding gate (Phase 7). Shown in place of the world map while
 * play is locked: the fresh/scratch player must (1) set a budget limit, then
 * (2) log a first expense to earn their first AP — which latches the gate open.
 *
 * The two-step model is reusable: Phase 8's guided tutorial continues past this
 * gate (talk → battle → claim) using the same OnboardingStep vocabulary.
 */
export default function OnboardingGate({ step, onSetBudget, onGoLog }: OnboardingGateProps) {
  const budgetDone = step !== 'set-budget';

  const steps = [
    {
      key: 'set-budget' as const,
      n: 1,
      title: 'Set your monthly budget',
      blurb: 'Every ledger begins with a limit. Calibrate your monthly allowance to open the ledger.',
      cta: 'Set Budget',
      action: onSetBudget,
      done: budgetDone,
      active: step === 'set-budget',
    },
    {
      key: 'log-expense' as const,
      n: 2,
      title: 'Log your first expense',
      blurb: 'Record real spending in the Ledger. Your first entry earns Action Points — the currency of adventure.',
      cta: 'Log an Expense',
      action: onGoLog,
      done: false,
      active: step === 'log-expense',
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto flex items-center justify-center p-6 text-center">
      <div className="w-full max-w-md">
        <p className="font-label text-[10px] uppercase tracking-[0.3em] text-primary/70 mb-2">A new adventure</p>
        <h2 className="font-headline text-3xl font-black text-primary mb-2">The Ledger Awaits</h2>
        <p className="font-body text-sm text-on-surface-variant/90 mb-8">
          The world map is sealed until you prove your ledger. Complete these two steps to begin.
        </p>

        <ol className="space-y-4 text-left">
          {steps.map(s => (
            <li
              key={s.key}
              className={`doodle-border p-4 transition-all ${
                s.active
                  ? 'bg-surface-container-highest border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : s.done
                  ? 'bg-surface-container/60 opacity-70'
                  : 'bg-surface-container/40 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`shrink-0 w-8 h-8 flex items-center justify-center font-headline font-black doodle-border ${
                    s.done ? 'bg-tertiary text-on-tertiary' : s.active ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant'
                  }`}
                >
                  {s.done ? '✓' : s.n}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline text-base font-bold text-on-surface">{s.title}</h3>
                  <p className="font-body text-xs text-on-surface-variant mt-1">{s.blurb}</p>
                  {s.active && (
                    <button
                      onClick={s.action}
                      className="mt-3 doodle-btn bg-primary text-on-primary px-5 py-2 font-headline font-black uppercase text-[11px] tracking-widest hover:scale-105 transition-transform"
                    >
                      {s.cta}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <p className="font-body text-[11px] italic text-on-surface-variant/70 mt-8">
          Your party, gear and potions are already mustered — travel unlocks the moment your first AP is earned.
        </p>
      </div>
    </div>
  );
}
