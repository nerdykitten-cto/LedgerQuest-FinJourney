import type { Quest, FinanceTask, Habit } from '../types/schemas';

interface QuestGaterProps {
  quest: Quest;
  tasks: FinanceTask[];
  habits: Habit[];
  ap: number;
  onAccept: () => void;
  onClose: () => void;
}

export default function QuestGater({ quest, tasks, habits, ap, onAccept, onClose }: QuestGaterProps) {
  const req = quest.requirements || { apQuota: 10, taskCount: 1, habitCount: 1 };
  
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const updatedHabits = habits.filter(h => h.lastCompleted && h.lastCompleted > Date.now() - 24 * 60 * 60 * 1000).length;

  const isApReady = ap >= req.apQuota;
  const isTasksReady = completedTasks >= req.taskCount;
  const isHabitsReady = updatedHabits >= req.habitCount;
  const canStart = isApReady && isTasksReady && isHabitsReady;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg tape-accent doodle-border bg-surface-container p-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.6)] flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Urgent Seal */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-primary/20 rounded-full flex items-center justify-center doodle-border border-dashed border-primary rotate-[-12deg] z-20 animate-pulse shadow-2xl backdrop-blur-sm overflow-hidden">
           <div className="text-center flex flex-col items-center">
              <img src="/assets/ui/Icon_Reward_Pass_rune.png" alt="" className="w-12 h-12 object-contain" />
              <p className="font-headline text-primary font-black text-[10px] uppercase leading-none mt-1">Royal<br/>Writ</p>
           </div>
        </div>

        <header className="text-center relative">
          <h2 className="font-headline text-3xl font-black text-primary uppercase tracking-tighter mb-2 drop-shadow-lg flex items-center justify-center gap-3">
             <img src="/assets/ui/Icon_Battle.png" alt="" className="w-8 h-8 object-contain" />
             Wellbeing Gatekeeper
          </h2>
          <p className="font-body text-sm text-on-surface-variant italic">"The realm awaits a leader of clear mind and stable ledger."</p>
          <div className="mt-6 p-3 bg-surface-container-high doodle-border border-dashed border-outline/30 shadow-inner">
             <p className="font-label text-[10px] uppercase tracking-widest text-on-surface flex items-center justify-center gap-3">
               <img src="/assets/ui/Icon_Star.png" alt="" className="w-4 h-4 object-contain animate-spin-slow" />
               Unlocking: <span className="text-tertiary font-black">{quest.title}</span>
               <img src="/assets/ui/Icon_Star.png" alt="" className="w-4 h-4 object-contain animate-spin-slow" />
             </p>
          </div>
        </header>

        <div className="flex flex-col gap-4">
          <div className={`flex items-center gap-5 p-5 doodle-border transition-all duration-500 shadow-md ${isApReady ? 'bg-primary/10 border-primary scale-[1.02]' : 'bg-surface/30 border-outline/20 opacity-60'}`}>
            <div className={`w-12 h-12 flex items-center justify-center rounded-full doodle-border border-dashed ${isApReady ? 'bg-primary shadow-[0_0_10px_rgba(244,208,63,0.5)]' : 'bg-surface-container'}`}>
              <img src="/assets/ui/Icon_Energy_Yellow.png" alt="" className={`w-8 h-8 object-contain ${!isApReady && 'grayscale opacity-50'}`} />
            </div>
            <div className="flex-1">
              <strong className="font-headline text-lg tracking-tight">Action Reserve</strong>
              <div className="flex justify-between items-end">
                 <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Requirement: {req.apQuota} AP</p>
                 <span className={`font-headline font-black ${isApReady ? 'text-primary text-xl' : 'text-on-surface-variant'}`}>{ap} / {req.apQuota}</span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-5 p-5 doodle-border transition-all duration-500 shadow-md ${isTasksReady ? 'bg-primary/10 border-primary scale-[1.02]' : 'bg-surface/30 border-outline/20 opacity-60'}`}>
            <div className={`w-12 h-12 flex items-center justify-center rounded-full doodle-border border-dashed ${isTasksReady ? 'bg-primary shadow-[0_0_10px_rgba(244,208,63,0.5)]' : 'bg-surface-container'}`}>
              <img src="/assets/ui/Icon_Quest.png" alt="" className={`w-8 h-8 object-contain ${!isTasksReady && 'grayscale opacity-50'}`} />
            </div>
            <div className="flex-1">
              <strong className="font-headline text-lg tracking-tight">Daily Feats</strong>
              <div className="flex justify-between items-end">
                 <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Requirement: {req.taskCount} Feats</p>
                 <span className={`font-headline font-black ${isTasksReady ? 'text-primary text-xl' : 'text-on-surface-variant'}`}>{completedTasks} / {req.taskCount}</span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-5 p-5 doodle-border transition-all duration-500 shadow-md ${isHabitsReady ? 'bg-primary/10 border-primary scale-[1.02]' : 'bg-surface/30 border-outline/20 opacity-60'}`}>
            <div className={`w-12 h-12 flex items-center justify-center rounded-full doodle-border border-dashed ${isHabitsReady ? 'bg-primary shadow-[0_0_10px_rgba(244,208,63,0.5)]' : 'bg-surface-container'}`}>
              <img src="/assets/ui/Icon_Hourglass.png" alt="" className={`w-8 h-8 object-contain ${!isHabitsReady && 'grayscale opacity-50'}`} />
            </div>
            <div className="flex-1">
              <strong className="font-headline text-lg tracking-tight">Sacred Rituals</strong>
              <div className="flex justify-between items-end">
                 <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Requirement: {req.habitCount} Rituals</p>
                 <span className={`font-headline font-black ${isHabitsReady ? 'text-primary text-xl' : 'text-on-surface-variant'}`}>{updatedHabits} / {req.habitCount}</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-col sm:flex-row gap-4 pt-6">
          <button 
            className="doodle-btn flex-1 bg-surface-container-highest text-on-surface-variant font-bold uppercase tracking-widest py-4 text-xs hover:bg-error/10 hover:text-error hover:border-error/30 transition-all shadow-md" 
            onClick={onClose}
          >
            Withdraw [ESC]
          </button>
          <button 
            className={`doodle-btn flex-[2] font-black uppercase tracking-[0.2em] py-4 text-sm transition-all shadow-2xl
              ${canStart ? 'bg-primary text-on-primary scale-105 hover:rotate-1 ring-2 ring-primary/20' : 'bg-surface/20 text-on-surface/10 cursor-not-allowed'}
            `}
            disabled={!canStart} 
            onClick={onAccept}
          >
            {canStart ? 'Embark on Quest' : 'Prerequisites Missing'}
          </button>
        </footer>

        {/* Squiggled Divider */}
        <div className="absolute bottom-0 left-0 w-full h-2 doodle-underline opacity-10"></div>
      </div>
    </div>
  );
}
