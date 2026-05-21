import { useState, useEffect, useCallback } from 'react';
import './App.css';
import type { 
  Expense, 
  PlayerStats, 
  Quest, 
  LogicEngineTrace, 
  FinanceTask, 
  CampaignState,
  Habit,
  PartyMember,
  BudgetStream,
  SavingsGoal
} from './types/schemas';
import { APEvaluator, ValueAdjuster, StoryTellingEngine } from './logicEngines';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import QuestList from './components/QuestList';
import QuestGater from './components/QuestGater';
import GameView from './components/GameView';
import TopAppBar from './components/TopAppBar';
import WarRoom from './components/WarRoom';
import GrandVault from './components/GrandVault';
import * as dbService from './persistenceService';
import { v4 as uuidv4 } from 'uuid';

const evaluator = new APEvaluator();
const adjuster = new ValueAdjuster();
const agent = new StoryTellingEngine();

function App() {
  const [currentTab, setCurrentTab] = useState('ledger');
  const [archiveTab, setArchiveTab] = useState<'ledger' | 'budget'>('ledger');
  const [stats, setStats] = useState<PlayerStats>({ level: 1, exp: 0, ap: 10, gold: 0, monthlyBudget: 3000 });
  const [campaign, setCampaign] = useState<CampaignState>({ 
    currentLocation: 'Starting Village', 
    progressPercentage: 0, 
    worldState: 'peace' 
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [tasks, setTasks] = useState<FinanceTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [budgets, setBudgets] = useState<BudgetStream[]>([]);
  const [_savings, setSavings] = useState<SavingsGoal[]>([]);
  const [_traces, setTraces] = useState<LogicEngineTrace[]>([]);
  const [party, setParty] = useState<PartyMember[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [gatedQuest, setGatedQuest] = useState<Quest | null>(null);
  
  const [isScribeOpen, setIsScribeOpen] = useState(false);
  const [isTransmuteOpen, setIsTransmuteOpen] = useState(false);
  const [isWarRoomOpen, setIsWarRoomOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  
  const [isTaskCreatorOpen, setIsTaskCreatorOpen] = useState(false);
  const [isHabitCreatorOpen, setIsHabitCreatorOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', isNecessity: false, ap: 10 });
  const [newHabit, setNewHabit] = useState({ name: '', difficulty: 1 });

  const showNotify = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Persistence Sync
  useEffect(() => {
    dbService.initializeLocalData();
    const unsubExpenses = dbService.subscribeExpenses(setExpenses);
    const unsubQuests = dbService.subscribeQuests(setQuests);
    const unsubStats = dbService.subscribeStats(setStats);
    const unsubCampaign = dbService.subscribeCampaign(setCampaign);
    const unsubTasks = dbService.subscribeTasks(setTasks);
    const unsubHabits = dbService.subscribeHabits(setHabits);
    const unsubTraces = dbService.subscribeTraces(setTraces);
    const unsubParty = dbService.subscribeParty(setParty);
    const unsubBudgets = dbService.subscribeBudgetStreams(setBudgets);
    const unsubSavings = dbService.subscribeSavingsGoals(setSavings);

    return () => {
      unsubExpenses(); unsubQuests(); unsubStats(); unsubCampaign(); 
      unsubTasks(); unsubHabits(); unsubTraces(); unsubParty(); 
      unsubBudgets(); unsubSavings();
    };
  }, []);

  const checkQuestObjective = useCallback(async (type: string, target: string) => {
     const activeQuest = quests.find(q => q.status === 'active');
     if (!activeQuest) return;

     const objIndex = activeQuest.objectives?.findIndex(o => o.type === type && o.target === target && !o.isCompleted);
     if (objIndex !== undefined && objIndex !== -1) {
        const updatedObjectives = [...(activeQuest.objectives || [])];
        updatedObjectives[objIndex] = { ...updatedObjectives[objIndex], isCompleted: true };
        
        const allDone = updatedObjectives.every(o => o.isCompleted);
        if (allDone) {
           await dbService.updateQuestDB(activeQuest.id, { status: 'completed', objectives: updatedObjectives });
           await dbService.updateStatsDB({ exp: stats.exp + activeQuest.reward.exp, gold: stats.gold + activeQuest.reward.gold });
           showNotify(`Quest Complete: ${activeQuest.title}!`);
        } else {
           await dbService.updateQuestDB(activeQuest.id, { objectives: updatedObjectives });
           showNotify(`Objective met: ${target}`);
        }
     }
  }, [quests, stats, showNotify]);

  // Story Engine - Logic Loop
  useEffect(() => {
    const runAgent = async () => {
      const { quest, trace } = await agent.process(expenses, stats, habits, campaign, quests);
      if (quest && !quests.find(q => q.id === quest.id)) {
        await dbService.addQuestDB(quest);
        showNotify('New Quest Unlocked: ' + quest.title);
      }
      if (trace.rationale !== 'Waiting for player to reach a town or complete active quests.') {
         await dbService.addTraceDB(trace);
      }
    };
    runAgent();
  }, [expenses.length, campaign.currentLocation, quests.length, stats.ap]);

  // --- RPG ACTIONS ---

  const handleTravel = useCallback(async (destination: string, cost: number) => {
    if (stats.ap >= cost) {
      await dbService.updateStatsDB({ ap: stats.ap - cost });
      await dbService.updateCampaign({ 
        currentLocation: destination, 
        progressPercentage: Math.min(100, campaign.progressPercentage + 5) 
      });
      checkQuestObjective('travel', destination);
      showNotify('Traveled to ' + destination);
    } else {
      showNotify('Not enough AP!');
    }
  }, [stats.ap, campaign.progressPercentage, checkQuestObjective, showNotify]);

  const handleTalk = useCallback(async (npcName: string, _message: string) => {
    checkQuestObjective('talk', npcName);
  }, [checkQuestObjective]);

  const handleActionCost = useCallback(async (cost: number) => {
    await dbService.updateStatsDB({ ap: Math.max(0, stats.ap - cost) });
  }, [stats.ap]);

  const handleBattleVictory = useCallback(async () => {
    const activeQuest = quests.find(q => q.status === 'active');
    if (activeQuest) {
      const targetObj = activeQuest.objectives?.find(o => o.type === 'kill' && !o.isCompleted);
      if (targetObj) checkQuestObjective('kill', targetObj.target);
    }
    await dbService.updateStatsDB({ exp: stats.exp + 100, gold: stats.gold + 50 });
    await dbService.updateCampaign({ worldState: 'peace' });
    showNotify('Victory! +100 XP / +50 Gold');
  }, [quests, stats.exp, stats.gold, checkQuestObjective, showNotify]);

  const handleBattleDefeat = useCallback(async () => {
    await dbService.updateCampaign({ worldState: 'peace' });
    showNotify('Defeated... Escaped to safety.');
  }, [showNotify]);

  const handleShopPurchase = useCallback(async (item: any, cost: number) => {
    if (stats.gold >= cost) {
      await dbService.updateStatsDB({ gold: stats.gold - cost });
      showNotify(`Acquired ${item.name}!`);
    } else {
      showNotify('Insufficient Gold!');
    }
  }, [stats.gold, showNotify]);

  const handleEnterTown = useCallback(async (name: string) => {
    await dbService.updateCampaign({ worldState: 'town', currentLocation: name });
    showNotify(`Entering ${name}...`);
  }, [showNotify]);

  const handleExitTown = useCallback(async () => {
    await dbService.updateCampaign({ worldState: 'peace' });
  }, []);

  const handleBattleAction = useCallback(async () => {
    const randomEnemy = {
      id: uuidv4(),
      name: 'Debt Gnome',
      hp: 50,
      maxHp: 50,
      attack: 5,
      defense: 2
    };
    await dbService.updateCampaign({ worldState: 'battle', activeEnemy: randomEnemy });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case 'l': setCurrentTab('ledger'); break;
        case 'h': setCurrentTab('trials'); break;
        case 'a': setCurrentTab('archive'); break;
        case 'q': setCurrentTab('quests'); break;
        case 'm': setIsWarRoomOpen(true); break;
        case 'i': setIsVaultOpen(true); break;
        case ' ': e.preventDefault(); setIsScribeOpen(true); break;
        case 'escape':
          setIsScribeOpen(false); setIsTransmuteOpen(false);
          setIsWarRoomOpen(false); setIsVaultOpen(false);
          setIsTaskCreatorOpen(false); setIsHabitCreatorOpen(false);
          setGatedQuest(null); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddExpense = async (expense: Expense) => {
    const isOverBudget = (totalExpenses + expense.amount) > totalIncome;
    const baseAP = 5;
    const bonusAP = isOverBudget ? 0 : 3;
    const totalAP = baseAP + bonusAP;

    await dbService.addExpenseDB(expense);
    await dbService.updateStatsDB({ ap: stats.ap + totalAP });
    
    if (isOverBudget) {
      showNotify(`+${baseAP} AP. Warning: Monthly Budget exceeded!`);
    } else {
      showNotify(`+${totalAP} AP! Bonus for staying within budget.`);
    }
    setIsScribeOpen(false);
  };

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const reward = evaluator.evaluateTaskReward(task);
      await dbService.updateTaskDB(taskId, { isCompleted: true });
      await dbService.updateStatsDB({ ap: stats.ap + reward });
      showNotify('+' + reward + ' AP: Feat Complete!');
    }
  };

  const handleCompleteHabit = useCallback(async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const { adjustedAP, newDifficulty } = adjuster.adjustHabit(habit);
      await dbService.updateHabitDB(habitId, { streak: habit.streak + 1, lastCompleted: Date.now(), difficulty: newDifficulty });
      await dbService.updateStatsDB({ ap: stats.ap + adjustedAP });
      showNotify('+' + adjustedAP + ' AP: Ritual Performed!');
    }
  }, [habits, stats.ap, showNotify]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    const task: FinanceTask = { id: uuidv4(), title: newTask.title, description: '', isNecessity: newTask.isNecessity, baseAPReward: newTask.ap, isCompleted: false };
    await dbService.addTaskDB(task);
    setNewTask({ title: '', isNecessity: false, ap: 10 });
    setIsTaskCreatorOpen(false);
    showNotify('Feat inscribed!');
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.name) return;
    const habit: Habit = { id: uuidv4(), name: newHabit.name, streak: 0, lastCompleted: 0, skipCount: 0, difficulty: newHabit.difficulty };
    const raw = localStorage.getItem('habits');
    const currentHabits = raw ? JSON.parse(raw) : [];
    localStorage.setItem('habits', JSON.stringify([...currentHabits, habit]));
    window.dispatchEvent(new Event('storage'));
    setNewHabit({ name: '', difficulty: 1 });
    setIsHabitCreatorOpen(false);
    showNotify('Ritual sealed!');
  };

  const handleStartQuest = (id: string) => {
     const q = quests.find(q => q.id === id);
     if (q) setGatedQuest(q);
  };

  const confirmStartQuest = async (quest: Quest) => {
    if (stats.ap >= 5) {
      await dbService.updateQuestDB(quest.id, { status: 'active' });
      await dbService.updateStatsDB({ ap: stats.ap - 5 });
      await dbService.updateCampaign({ activeQuestId: quest.id });
      setGatedQuest(null);
      showNotify('Embarking: ' + quest.title);
    }
  };

  const handleCompleteQuest = async (id: string) => {
     const q = quests.find(q => q.id === id);
     if (q && q.status === 'active') {
        const allDone = q.objectives?.every(o => o.isCompleted);
        if (allDone) {
           await dbService.updateQuestDB(id, { status: 'completed' });
           await dbService.updateStatsDB({ exp: stats.exp + q.reward.exp, gold: stats.gold + q.reward.gold });
           showNotify(`Quest Success!`);
        } else {
           showNotify('Objectives remain incomplete.');
        }
     }
  };

  const [isBudgetEditorOpen, setIsBudgetEditorOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(stats.monthlyBudget || 3000);

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.updateStatsDB({ monthlyBudget: newBudget });
    setIsBudgetEditorOpen(false);
    showNotify('Monthly Budget calibrated.');
  };

  const totalIncome = stats.monthlyBudget || 3000;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-surface text-on-surface paper-texture font-body">
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] doodle-border bg-surface-container-highest px-6 py-2 font-headline animate-bounce shadow-2xl border-primary/50 text-primary">
          {notification}
        </div>
      )}
      
      {gatedQuest && <QuestGater quest={gatedQuest} tasks={tasks} habits={habits} ap={stats.ap} onAccept={() => confirmStartQuest(gatedQuest)} onClose={() => setGatedQuest(null)} />}

      {isBudgetEditorOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
          <div className="w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <div className="tape-accent doodle-border bg-surface-container p-8 shadow-2xl">
              <h3 className="font-headline text-2xl font-bold text-primary mb-6">Calibrate Budget</h3>
              <form onSubmit={handleUpdateBudget} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <span className="font-label text-[10px] uppercase text-on-surface-variant">Monthly Allowance ($)</span>
                  <input 
                    className="w-full bg-surface doodle-border py-3 px-4 text-primary font-bold text-2xl outline-none" 
                    type="number" 
                    value={newBudget} 
                    onChange={e => setNewBudget(parseInt(e.target.value) || 0)} 
                    required 
                  />
                </div>
                <button type="submit" className="w-full doodle-btn bg-primary text-on-primary py-3 font-headline font-black uppercase tracking-widest">Update Limit</button>
                <button type="button" onClick={() => setIsBudgetEditorOpen(false)} className="w-full text-[10px] font-label uppercase text-on-surface-variant hover:text-primary transition-colors">Dismiss</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isScribeOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
          <div className="w-full max-w-2xl relative animate-in zoom-in-95 duration-200">
            <button className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-surface-container-highest doodle-border z-10 flex items-center justify-center hover:scale-110 transition-transform" onClick={() => setIsScribeOpen(false)}><span className="material-symbols-outlined">close</span></button>
            <div className="tape-accent doodle-border bg-surface-container p-8 shadow-2xl"><ExpenseForm onAddExpense={handleAddExpense} /></div>
          </div>
        </div>
      )}

      {isTransmuteOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
          <div className="w-full max-w-lg relative animate-in zoom-in-95 duration-200">
            <button className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-surface-container-highest doodle-border z-10 flex items-center justify-center hover:scale-110 transition-transform" onClick={() => setIsTransmuteOpen(false)}><span className="material-symbols-outlined">close</span></button>
            <div className="tape-accent doodle-border bg-surface-container p-8 shadow-2xl">
               <h2 className="font-headline text-2xl font-bold text-primary mb-6 flex items-center gap-2"><img src="/assets/ui/Icon_GearWheels.png" className="w-8 h-8" /> Transmute Budget</h2>
               <div className="space-y-6">
                  {budgets.map(b => (
                    <div key={b.id} className="space-y-2">
                       <div className="flex justify-between font-label text-[10px] uppercase tracking-widest text-on-surface-variant"><span>{b.category}</span><span className="font-black text-on-surface">${b.allocatedAmount}</span></div>
                       <input type="range" className="w-full accent-primary bg-surface-container-highest h-2 rounded-full appearance-none cursor-pointer" min="0" max="2000" step="50" value={b.allocatedAmount} onChange={(e) => dbService.updateBudgetStreamDB(b.id, { allocatedAmount: parseInt(e.target.value) })} />
                    </div>
                  ))}
               </div>
               <button onClick={() => setIsTransmuteOpen(false)} className="w-full mt-10 doodle-btn bg-primary text-on-primary font-headline font-black py-3 uppercase tracking-widest">Seal the Grimoire</button>
            </div>
          </div>
        </div>
      )}

      {isWarRoomOpen && <WarRoom party={party} onClose={() => setIsWarRoomOpen(false)} onAddMember={() => showNotify('Requires City visit.')} onRemoveMember={() => {}} />}
      {isVaultOpen && <GrandVault onClose={() => setIsVaultOpen(false)} />}

      <TopAppBar currentTab={currentTab} onTabChange={setCurrentTab} ap={stats.ap} />

      <main className="max-w-[1200px] mx-auto px-6 md:px-10 mt-8 pb-32">
        {currentTab === 'ledger' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div><h2 className="font-headline text-3xl font-bold text-primary doodle-underline inline-block mb-2">Personal Ledger</h2><p className="font-body text-lg text-on-surface-variant italic">Annotating financial flow.</p></div>
              <div className="flex gap-4"><button onClick={() => setIsScribeOpen(true)} className="bg-primary text-on-primary px-6 py-3 font-headline font-bold doodle-border hover:scale-105 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"><img src="/assets/ui/Icon_Gold.png" className="w-6 h-6" /> Scribe Expense</button></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div onClick={() => { setNewBudget(totalIncome); setIsBudgetEditorOpen(true); }} className="bg-surface-container p-6 doodle-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group cursor-pointer hover:bg-primary/5 transition-all">
                <span className="font-label text-[10px] uppercase text-on-surface-variant flex justify-between">Monthly Budget <span className="material-symbols-outlined text-xs">edit</span></span>
                <div className="font-headline text-3xl font-black text-primary">${totalIncome.toLocaleString()}</div>
              </div>
              <div className="bg-surface-container p-6 doodle-border shadow-[6px_6px_0px_0px_rgba(244,208,63,0.2)] flex flex-col justify-between group">
                <span className="font-label text-[10px] uppercase text-on-surface-variant">Total Expenses</span>
                <div className="font-headline text-3xl font-black text-secondary">${totalExpenses.toLocaleString()}</div>
              </div>
              <div className={`bg-surface-container p-6 doodle-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group ${remainingBudget < 0 ? 'border-error animate-pulse' : ''}`}>
                <span className="font-label text-[10px] uppercase text-on-surface-variant">Remaining Safe</span>
                <div className={`font-headline text-3xl font-black ${remainingBudget < 0 ? 'text-error' : 'text-tertiary'}`}>${remainingBudget.toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-surface-container-low p-8 doodle-border shadow-xl"><ExpenseList expenses={expenses} /></div>
          </div>
        )}

        {currentTab === 'trials' && (
          <div className="animate-in fade-in duration-500 space-y-16">
             <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div><h2 className="font-headline text-4xl font-black text-primary doodle-underline inline-block mb-2">The Trial Log</h2><p className="font-body text-lg text-on-surface-variant italic">Rituals of discipline.</p></div>
                <div className="flex gap-4">
                   <button onClick={() => setIsTaskCreatorOpen(true)} className="bg-surface-container px-6 py-3 doodle-border font-headline font-bold text-on-surface hover:bg-primary/10 transition-all flex items-center gap-2"><img src="/assets/ui/Icon_Quest.png" className="w-6 h-6" /> Scribe Feat</button>
                   <button onClick={() => setIsHabitCreatorOpen(true)} className="bg-surface-container px-6 py-3 doodle-border font-headline font-bold text-on-surface hover:bg-tertiary/10 transition-all flex items-center gap-2"><img src="/assets/ui/Icon_Star.png" className="w-6 h-6" /> New Ritual</button>
                </div>
             </div>
             
             {isTaskCreatorOpen && (
               <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
                  <div className="w-full max-w-md relative animate-in zoom-in-95 duration-200">
                     <div className="tape-accent doodle-border bg-surface-container p-8 shadow-2xl">
                        <h3 className="font-headline text-2xl font-bold text-primary mb-6">Scribe New Feat</h3>
                        <form onSubmit={handleAddTask} className="space-y-6">
                           <input className="w-full bg-transparent pencil-line py-2 outline-none font-headline text-xl" type="text" placeholder="Feat title..." value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                           <div className="flex justify-between items-center"><label className="flex items-center gap-2 font-label text-[10px] uppercase cursor-pointer"><input type="checkbox" className="accent-primary" checked={newTask.isNecessity} onChange={e => setNewTask({...newTask, isNecessity: e.target.checked})} /> Necessity</label><div className="flex items-center gap-2"><span className="font-label text-[10px] uppercase">AP:</span><input className="w-12 bg-surface text-center doodle-border py-1 text-primary font-bold" type="number" value={newTask.ap} onChange={e => setNewTask({...newTask, ap: parseInt(e.target.value) || 0})} /></div></div>
                           <button type="submit" className="w-full doodle-btn bg-primary text-on-primary py-3 font-headline font-black uppercase tracking-widest">Inscribe Feat</button>
                        </form>
                     </div>
                  </div>
               </div>
             )}

             {isHabitCreatorOpen && (
               <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
                  <div className="w-full max-w-md relative animate-in zoom-in-95 duration-200">
                     <div className="tape-accent doodle-border bg-surface-container p-8 shadow-2xl">
                        <h3 className="font-headline text-2xl font-bold text-tertiary mb-6">New Ritual</h3>
                        <form onSubmit={handleAddHabit} className="space-y-6">
                           <input className="w-full bg-transparent pencil-line py-2 outline-none font-headline text-xl" type="text" placeholder="Ritual name..." value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})} required />
                           <button type="submit" className="w-full doodle-btn bg-tertiary text-on-tertiary py-3 font-headline font-black uppercase tracking-widest">Seal Ritual</button>
                        </form>
                     </div>
                  </div>
               </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8">
                   <h3 className="font-headline text-2xl font-bold text-on-surface uppercase border-l-4 border-tertiary pl-4">Daily Rituals</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {habits.map(h => (
                        <div key={h.id} className="tape-accent doodle-border bg-surface-container p-6 hover:translate-y-[-4px] transition-transform group">
                           <div className="flex justify-between items-start mb-6">
                              <div><h4 className="font-headline text-xl font-bold group-hover:text-tertiary">{h.name}</h4><p className="text-[10px] font-label uppercase text-on-surface-variant">LV.{h.difficulty} RITUAL</p></div>
                              <div className="flex items-center gap-1 text-primary"><span className="font-headline text-lg font-black">{h.streak}</span><img src="/assets/ui/Icon_Energy_Green.png" className="w-4 h-4" /></div>
                           </div>
                           <button onClick={() => handleCompleteHabit(h.id)} className="w-full doodle-btn bg-tertiary text-on-tertiary py-3 font-headline font-black uppercase text-xs flex items-center justify-center gap-2 group-hover:scale-105 transition-all">Perform Ritual (+{adjuster.adjustHabit(h).adjustedAP} AP)</button>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="lg:col-span-4 space-y-8">
                   <h3 className="font-headline text-2xl font-bold text-on-surface uppercase border-l-4 border-primary pl-4">One-Time Feats</h3>
                   <div className="space-y-4">
                      {tasks.filter(t => !t.isCompleted).map(t => (
                        <div key={t.id} onClick={() => handleCompleteTask(t.id)} className="bg-surface-container p-6 doodle-border hover:bg-surface-variant flex justify-between group cursor-pointer shadow-md">
                           <div><span className="font-headline text-lg font-bold text-on-surface block group-hover:text-primary">{t.title}</span><span className="font-label text-[8px] uppercase text-on-surface-variant">{t.isNecessity ? 'Vital' : 'Minor'} Feat</span></div>
                           <div className="text-right text-primary font-black">+{evaluator.evaluateTaskReward(t)} AP</div>
                        </div>
                      ))}
                      <button onClick={() => setIsTaskCreatorOpen(true)} className="w-full py-4 border-2 border-dashed border-outline/30 text-on-surface-variant font-label text-[10px] uppercase hover:text-primary transition-all">+ Scribe Feat</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {currentTab === 'archive' && (
          <div className="animate-in fade-in duration-500">
             <div className="mb-8 flex justify-between items-end gap-4">
                <div>
                   <h1 className="font-headline text-4xl font-black text-primary doodle-underline inline-block">Grand Archive</h1>
                   <p className="font-body text-sm text-on-surface-variant italic mt-2">Historical financial records and goal calibration.</p>
                </div>
                <div className="flex flex-col md:flex-row items-end gap-4">
                  <button onClick={() => { setNewBudget(totalIncome); setIsBudgetEditorOpen(true); }} className="bg-surface-container px-4 py-2 doodle-border font-label text-[10px] uppercase font-black hover:text-primary transition-all flex items-center gap-2 shadow-md mb-1">
                    <span className="material-symbols-outlined text-sm">tune</span> Calibrate Budget
                  </button>
                  <div className="flex bg-surface-container-high rounded-full p-1 doodle-border shadow-inner">
                    <button onClick={() => setArchiveTab('ledger')} className={`px-6 py-2 rounded-full font-label text-[10px] uppercase tracking-widest transition-all ${archiveTab === 'ledger' ? 'bg-primary text-on-primary font-black shadow-lg' : 'text-on-surface-variant font-bold hover:bg-surface-variant'}`}>Ledger</button>
                    <button onClick={() => setArchiveTab('budget')} className={`px-6 py-2 rounded-full font-label text-[10px] uppercase tracking-widest transition-all ${archiveTab === 'budget' ? 'bg-primary text-on-primary font-black shadow-lg' : 'text-on-surface-variant font-bold hover:bg-surface-variant'}`}>Streams</button>
                  </div>
                </div>
             </div>
             <div className="bg-surface-container-low p-8 doodle-border shadow-2xl min-h-[600px]">
                {archiveTab === 'ledger' ? <ExpenseList expenses={expenses} /> : (
                  <div className="space-y-12">
                     <h3 className="font-headline text-2xl font-bold text-on-surface doodle-underline inline-block">Active Budget Streams</h3>
                     <div className="grid grid-cols-1 gap-8">{budgets.map(b => {
                        const catTotal = expenses.filter(e => e.category === b.category).reduce((s, e) => s + e.amount, 0);
                        const perc = Math.min(100, (catTotal / b.allocatedAmount) * 100);
                        return (
                          <div key={b.id} className="bg-surface-container p-6 doodle-border group hover:bg-surface-container-high transition-colors">
                             <div className="flex justify-between items-end mb-4"><div><span className="font-label text-[10px] uppercase text-on-surface-variant">Stream: {b.category}</span><h4 className="font-headline text-2xl font-black text-on-surface">${catTotal.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">of ${b.allocatedAmount}</span></h4></div><div className="text-right text-primary font-black">{Math.round(perc)}%</div></div>
                             <div className="h-4 w-full bg-surface/50 doodle-border p-0.5"><div className={`h-full transition-all duration-1000 ${perc > 90 ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${perc}%` }}></div></div>
                          </div>
                        );
                     })}</div>
                  </div>
                )}
             </div>
          </div>
        )}

        {currentTab === 'quests' && (
          <div className="animate-in zoom-in-95 duration-500 h-[calc(100vh-12rem)] min-h-[600px] flex flex-col gap-8">
             <div className="flex justify-between items-end gap-4">
                <div><h1 className="font-headline text-3xl font-black text-primary mb-2 doodle-underline inline-block">Strategic Map</h1><p className="font-body text-lg text-on-surface-variant italic">Expend AP to navigate.</p></div>
                <div className="flex gap-4">
                   <button onClick={() => setIsWarRoomOpen(true)} className="bg-surface-container-high text-on-surface px-6 py-2 doodle-border font-label text-[10px] uppercase font-black hover:bg-primary transition-all">War Room</button>
                   <button onClick={() => setIsVaultOpen(true)} className="bg-surface-container-high text-on-surface px-6 py-2 doodle-border font-label text-[10px] uppercase font-black hover:bg-primary transition-all">Vault</button>
                </div>
             </div>
             <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
                <div className="lg:col-span-8 bg-[#0a0f1a] relative overflow-hidden shadow-2xl rounded-2xl">
                   <GameView 
                  stats={stats} 
                  campaign={campaign} 
                  party={party} 
                  onTravel={handleTravel}
                  onTalk={handleTalk}
                  onBattleVictory={handleBattleVictory}
                  onBattleDefeat={handleBattleDefeat}
                  onBattleAction={handleBattleAction}
                  onActionCost={handleActionCost}
                  onShopPurchase={handleShopPurchase}
                  onEnterTown={handleEnterTown}
                  onExitTown={handleExitTown}
                /></div>
                <div className="lg:col-span-4 overflow-y-auto pr-4 custom-scrollbar"><QuestList quests={quests} onStartQuest={handleStartQuest} onCompleteQuest={handleCompleteQuest} /></div>
             </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-50 p-6 md:hidden"><div className="bg-surface-container doodle-border shadow-2xl flex justify-around p-4 backdrop-blur-md"><button onClick={() => setCurrentTab('ledger')} className={`material-symbols-outlined ${currentTab === 'ledger' ? 'text-primary' : 'text-on-surface-variant'}`}>dashboard</button><button onClick={() => setCurrentTab('trials')} className={`material-symbols-outlined ${currentTab === 'trials' ? 'text-primary' : 'text-on-surface-variant'}`}>history_edu</button><button onClick={() => setCurrentTab('archive')} className={`material-symbols-outlined ${currentTab === 'archive' ? 'text-primary' : 'text-on-surface-variant'}`}>menu_book</button><button onClick={() => setCurrentTab('quests')} className={`material-symbols-outlined ${currentTab === 'quests' ? 'text-primary' : 'text-on-surface-variant'}`}>explore</button></div></footer>
    </div>
  );
}

export default App;
