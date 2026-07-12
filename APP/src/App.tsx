import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import './App.css';
import type { 
  Expense, 
  PlayerStats, 
  Quest, 
  FinanceTask, 
  CampaignState,
  Habit,
  PartyMember,
  BudgetStream,
  SavingsGoal,
  InventoryItem
} from './types/schemas';
import { Director, type BattleResult } from './engine/director';
import type { DirectorTrace } from './engine/traceHub';
import { recruitCost } from './engine/recruitment';
import { adjustHabitReward } from './engine/difficultyEngine';
import { taskReward, applyExp, applyWinRecovery, applyDefeatRecovery } from './engine/rewardEngine';
import { planRevive, planEquip, planUnequip, planHeal } from './engine/equipment';
import { GEAR_BY_NAME } from './data/gear';
import { CURRENCIES, formatMoney } from './data/currencies';
import { nonBossObjectivesComplete, bossObjective, resolveBoss } from './engine/chronicle';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import QuestList from './components/QuestList';
import QuestGater from './components/QuestGater';
import OnboardingGate from './components/OnboardingGate';
import { currentOnboardingStep, isPlayUnlocked, shouldLatchUnlock, type PlayerProfile } from './engine/onboarding';
// GameView (CRT TV + AdventureWorld scenes) is code-split into its own chunk;
// it only loads when the player opens the Strategic Map tab.
const GameView = lazy(() => import('./components/GameView'));
import TopAppBar from './components/TopAppBar';
import SettingsModal from './components/SettingsModal';
import DemoFooter from './components/DemoFooter';
import WarRoom from './components/WarRoom';
import GrandVault from './components/GrandVault';
import * as dbService from './persistenceService';
import { v4 as uuidv4 } from 'uuid';

const director = new Director();

const ITEM_TEMPLATES: Record<string, Partial<InventoryItem>> = {
  'Midas Elixir': {
    templateId: 'midas-elixir',
    name: 'Midas Elixir',
    type: 'Consumable',
    icon: 'science',
    sprite: '/assets/ui/Icon_Energy_Green.png',
    description: 'A golden liquid that tastes like sun-warmed honey and financial stability.',
    stats: '+20 HP',
    statBonus: { hpHeal: 20 },
    weight: 0.5
  },
  'Revive Tonic': {
    templateId: 'revive-tonic',
    name: 'Revive Tonic',
    type: 'Consumable',
    icon: 'cardiology',
    description: 'Revives a fallen ally to 50% health.',
    stats: 'Revive 50% HP',
    statBonus: { revive: 0.5 },
    weight: 0.5
  },
  ...GEAR_BY_NAME,
};

function App() {
  const [currentTab, setCurrentTab] = useState('ledger');
  const [archiveTab, setArchiveTab] = useState<'ledger' | 'budget' | 'savings' | 'engine'>('ledger');
  // Seed scratch (first run) / top-up BEFORE first paint so the very first render
  // already reflects the real profile+stats — otherwise the world-loop effect could
  // fire a quest offer against the optimistic defaults before the gate loads.
  const bootstrapped = useRef(false);
  if (!bootstrapped.current) {
    bootstrapped.current = true;
    dbService.initializeLocalData();
  }
  const [stats, setStats] = useState<PlayerStats>(() => {
    const raw = localStorage.getItem('player/stats');
    return raw ? JSON.parse(raw) : { level: 1, exp: 0, ap: 10, gold: 0, monthlyBudget: 3000 };
  });
  const [campaign, setCampaign] = useState<CampaignState>({ 
    currentLocation: 'Starting Village', 
    progressPercentage: 0, 
    worldState: 'peace' 
  });
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const raw = localStorage.getItem('player/profile');
    return raw ? JSON.parse(raw) : { onboardingComplete: true };
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [tasks, setTasks] = useState<FinanceTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [budgets, setBudgets] = useState<BudgetStream[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [traces, setTraces] = useState<DirectorTrace[]>([]);
  const [party, setParty] = useState<PartyMember[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [gatedQuest, setGatedQuest] = useState<Quest | null>(null);
  
  const [isScribeOpen, setIsScribeOpen] = useState(false);
  const [isTransmuteOpen, setIsTransmuteOpen] = useState(false);
  const [isWarRoomOpen, setIsWarRoomOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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
    const unsubExpenses = dbService.subscribeExpenses(setExpenses);
    const unsubQuests = dbService.subscribeQuests(setQuests);
    const unsubStats = dbService.subscribeStats(setStats);
    const unsubCampaign = dbService.subscribeCampaign(setCampaign);
    const unsubTasks = dbService.subscribeTasks(setTasks);
    const unsubHabits = dbService.subscribeHabits(setHabits);
    const unsubTraces = dbService.subscribeEngineTraces(setTraces);
    const unsubParty = dbService.subscribeParty(setParty);
    const unsubBudgets = dbService.subscribeBudgetStreams(setBudgets);
    const unsubSavings = dbService.subscribeSavingsGoals(setSavings);
    const unsubInventory = dbService.subscribeInventory(setInventory);
    const unsubProfile = dbService.subscribeProfile(setProfile);

    return () => {
      unsubExpenses(); unsubQuests(); unsubStats(); unsubCampaign(); 
      unsubTasks(); unsubHabits(); unsubTraces(); unsubParty(); 
      unsubBudgets(); unsubSavings(); unsubInventory(); unsubProfile();
    };
  }, []);

  // Game Director - day tick on boot (runs once habits have hydrated)
  const didBoot = useRef(false);
  useEffect(() => {
    if (didBoot.current || habits.length === 0) return;
    didBoot.current = true;
    const actions = director.onEvent({ type: 'boot', now: Date.now(), habits, budgets });
    for (const a of actions) {
      if (a.kind === 'apply-day-tick') {
        a.habits.forEach(h => dbService.updateHabitDB(h.id, { skipCount: h.skipCount, streak: h.streak }));
        if (a.monthRolled) a.budgets.forEach(b => dbService.updateBudgetStreamDB(b.id, { spentAmount: b.spentAmount }));
        showNotify(`Welcome back! ${a.missedDays} day(s) away - habit momentum adjusted.`);
      }
    }
  }, [habits, budgets, showNotify]);

  // Phase 7: budget-first gate. Latch play open once a budget is set AND the first
  // AP is earned (from the first logged expense). One-way — spending AP back to 0
  // afterwards never re-locks the map.
  useEffect(() => {
    if (shouldLatchUnlock(stats, profile)) {
      dbService.updateProfile({ onboardingComplete: true });
      showNotify('Adventure unlocked! The world map awaits.');
    }
  }, [stats, profile, showNotify]);

  // Item 4: chronicle boss invasion. When the active main quest's non-boss objectives are all
  // done (talk/travel), the boss invades the current town. Presence of campaign.invasion locks
  // the town until the boss is beaten.
  useEffect(() => {
    if (campaign.invasion) return; // already invading
    const mainQ = quests.find(q => q.status === 'active' && q.type === 'main');
    if (mainQ && nonBossObjectivesComplete(mainQ)) {
      const boss = bossObjective(mainQ);
      if (boss) {
        dbService.updateCampaign({ invasion: { town: campaign.currentLocation, questId: mainQ.id, bossName: boss.target } });
        showNotify(`A ${boss.target} has invaded ${campaign.currentLocation}!`);
      }
    }
  }, [quests, campaign.invasion, campaign.currentLocation, showNotify]);

  const handleInvasionFight = useCallback(async () => {
    if (!campaign.invasion) return;
    const boss = resolveBoss(campaign.invasion.bossName, campaign.progressPercentage);
    await dbService.updateCampaign({ worldState: 'battle', activeEnemy: boss, battleOrigin: 'invasion' });
  }, [campaign.invasion, campaign.progressPercentage]);

  const handleInvasionEscape = useCallback(async () => {
    // Flee to the World Map. The invasion stays set, so re-entering the town re-shows the dialog.
    await dbService.updateCampaign({ worldState: 'peace' });
    showNotify('You flee to the world map. The town remains under siege...');
  }, [showNotify]);

  const checkQuestObjective = useCallback(async (type: string, target: string) => {
     const activeQuest = quests.find(q => q.status === 'active');
     if (!activeQuest) return;

     const objIndex = activeQuest.objectives?.findIndex(o => o.type === type && o.target === target && !o.isCompleted);
     if (objIndex !== undefined && objIndex !== -1) {
        const updatedObjectives = [...(activeQuest.objectives || [])];
        updatedObjectives[objIndex] = { ...updatedObjectives[objIndex], isCompleted: true };
        
        const allDone = updatedObjectives.every(o => o.isCompleted);
        if (allDone) {
           await dbService.updateQuestDB(activeQuest.id, { status: 'ready', objectives: updatedObjectives });
           showNotify(`Quest Objectives Met: ${activeQuest.title}! Claim rewards in the Strategic Map.`);
        } else {
           await dbService.updateQuestDB(activeQuest.id, { objectives: updatedObjectives });
           showNotify(`Objective met: ${target}`);
        }
     }
  }, [quests, showNotify]);

  const handleClaimReward = async (id: string) => {
     const q = quests.find(q => q.id === id);
     if (q && q.status === 'ready') {
        await dbService.updateQuestDB(id, { status: 'completed' });
        await dbService.updateStats(cur => {
          const leveled = applyExp(cur, q.reward.exp);
          return { level: leveled.stats.level, exp: leveled.stats.exp, gold: cur.gold + q.reward.gold };
        });
        
        if (q.reward.items && q.reward.items.length > 0) {
           for (const itemKey of q.reward.items) {
              const template = ITEM_TEMPLATES[itemKey] || {
                 templateId: 'generic-item',
                 name: itemKey,
                 type: 'Quest',
                 icon: 'info',
                 sprite: '/assets/ui/Icon_Quest.png',
                 description: 'An item of narrative importance.',
                 weight: 0.1
              };
              
              const existing = inventory.find(invItem => invItem.templateId === template.templateId && invItem.type === 'Consumable');
              if (existing) {
                 await dbService.updateInventoryItemDB(existing.id, { quantity: existing.quantity + 1 });
              } else {
                 const newItem: InventoryItem = {
                    id: uuidv4(),
                    templateId: template.templateId || 'generic',
                    name: template.name || itemKey,
                    type: template.type || 'Quest',
                    slot: template.slot,
                    icon: template.icon || 'info',
                    sprite: template.sprite,
                    description: template.description || '',
                    stats: template.stats,
                    statBonus: template.statBonus,
                    weight: template.weight || 0,
                    quantity: 1
                 };
                 await dbService.addInventoryItemDB(newItem);
              }
           }
        }
        
        showNotify(`Claimed ${q.reward.gold} Gold, ${q.reward.exp} XP` + (q.reward.items?.length ? ' and items!' : '!'));
     }
  };

  // Game Director - world evaluation loop
  useEffect(() => {
    // Phase 7: hold all quest offers until the budget-first gate is unlocked, so a
    // scratch player's ledger stays truly empty (no available quest) during onboarding.
    if (!isPlayUnlocked(stats, profile)) return;
    const actions = director.onEvent({ type: 'world-changed', campaign, quests, expenses });
    for (const a of actions) {
      if (a.kind === 'offer-quest' && !quests.find(q => q.id === a.quest.id)) {
        dbService.addQuestDB(a.quest);
        showNotify('New Quest Unlocked: ' + a.quest.title);
      }
    }
  }, [expenses.length, campaign.currentLocation, campaign.worldState, quests.length, stats.ap, stats.monthlyBudget, profile.onboardingComplete]);

  // --- RPG ACTIONS ---

  const handleTravel = useCallback(async (destination: string, cost: number) => {
    if (!isPlayUnlocked(stats, profile)) {
      showNotify('Set your budget and log an expense to begin your journey.');
      return;
    }
    if (stats.ap >= cost) {
      await dbService.updateStats(cur => ({ ap: Math.max(0, cur.ap - cost) }));
      director.onEvent({ type: 'ap-spent', amount: cost });
      await dbService.updateCampaign({
        currentLocation: destination, 
        progressPercentage: Math.min(100, campaign.progressPercentage + 5) 
      });
      checkQuestObjective('travel', destination);
      showNotify('Traveled to ' + destination);
    } else {
      showNotify('Not enough AP!');
    }
  }, [stats, profile, campaign.progressPercentage, checkQuestObjective, showNotify]);

  const handleTalk = useCallback(async (npcName: string, _message: string) => {
    checkQuestObjective('talk', npcName);
  }, [checkQuestObjective]);

  const handleActionCost = useCallback(async (cost: number) => {
    if (!isPlayUnlocked(stats, profile)) return;
    await dbService.updateStats(cur => ({ ap: Math.max(0, cur.ap - cost) }));
    director.onEvent({ type: 'ap-spent', amount: cost });
  }, [stats, profile]);

  const handleBattleVictory = useCallback(async (result: BattleResult) => {
    const activeQuest = quests.find(q => q.status === 'active');
    if (activeQuest) {
      const targetObj = activeQuest.objectives?.find(o => o.type === 'kill' && !o.isCompleted);
      if (targetObj) checkQuestObjective('kill', targetObj.target);
    }
    const actions = director.onEvent({ type: 'battle-finished', won: true, ...result, stats, party });
    for (const a of actions) {
      if (a.kind === 'battle-reward') {
        await dbService.updateStats(cur => ({ level: a.stats.level, exp: a.stats.exp, gold: cur.gold + a.gold }));
        const healed = a.levelsGained > 0 ? a.party : applyWinRecovery(a.party);
        for (const m of healed) {
          await dbService.updatePartyMemberDB(m.id, { level: m.level, maxHp: m.maxHp, hp: m.hp, attack: m.attack, defense: m.defense });
        }
        showNotify(
          a.levelsGained > 0
            ? `Victory! +${a.exp} XP / +${a.gold} Gold - LEVEL UP to Lv ${a.stats.level}! Party +${a.levelsGained} lvl, +${10 * a.levelsGained} Max HP, fully healed`
            : `Victory! +${a.exp} XP / +${a.gold} Gold`
        );
      }
    }
    await dbService.updateCampaign({ worldState: campaign.battleOrigin === 'town' ? 'town' : 'peace', battleOrigin: undefined });
  }, [quests, stats, party, campaign.battleOrigin, checkQuestObjective, showNotify]);

  const handleBattleDefeat = useCallback(async (result: BattleResult) => {
    director.onEvent({ type: 'battle-finished', won: false, ...result, stats, party });
    const revived = applyDefeatRecovery(party);
    const changed = revived.filter((m, i) => m.hp !== party[i].hp);
    for (const m of changed) {
      await dbService.updatePartyMemberDB(m.id, { hp: m.hp });
    }
    const survivor = changed[0];
    await dbService.updateCampaign({ worldState: campaign.battleOrigin === 'town' ? 'town' : 'peace', battleOrigin: undefined });
    showNotify(survivor ? `Defeated... ${survivor.name} was revived to fight another day.` : 'Defeated... Escaped to safety.');
  }, [stats, party, campaign.battleOrigin, showNotify]);

  const handleShopPurchase = useCallback(async (item: any, cost: number) => {
    if (stats.gold >= cost) {
      await dbService.updateStats(cur => ({ gold: Math.max(0, cur.gold - cost) }));
      
      const existing = inventory.find(invItem => invItem.templateId === item.id && invItem.type === 'Consumable');
      if (existing) {
        await dbService.updateInventoryItemDB(existing.id, { quantity: existing.quantity + 1 });
      } else {
        const newItem: InventoryItem = {
          id: uuidv4(),
          templateId: item.id,
          name: item.name,
          type: item.type,
          slot: item.slot,
          icon: item.icon,
          sprite: item.sprite,
          description: item.name + ' acquired from the Armory.',
          stats: item.stats,
          statBonus: item.statBonus,
          weight: item.weight,
          quantity: 1
        };
        await dbService.addInventoryItemDB(newItem);
      }
      showNotify(`Acquired ${item.name}!`);
    } else {
      showNotify('Insufficient Gold!');
    }
  }, [stats.gold, inventory, showNotify]);

  const handleEnterTown = useCallback(async (name: string) => {
    await dbService.updateCampaign({ worldState: 'town', currentLocation: name });
    showNotify(`Entering ${name}...`);
  }, [showNotify]);

  const handleExitTown = useCallback(async () => {
    await dbService.updateCampaign({ worldState: 'peace' });
  }, []);

  const handleBattleAction = useCallback(async () => {
    const actions = director.onEvent({ type: 'battle-requested', progress: campaign.progressPercentage });
    for (const a of actions) {
      if (a.kind === 'spawn-enemy') {
        await dbService.updateCampaign({ worldState: 'battle', activeEnemy: a.enemy, battleOrigin: 'town' });
      }
    }
  }, [campaign.progressPercentage]);

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
    await dbService.updateStats(cur => ({ ap: cur.ap + totalAP }));
    director.onEvent({ type: 'expense-logged', now: Date.now(), apEarned: totalAP });
    
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
      const reward = taskReward(task);
      await dbService.updateTaskDB(taskId, { isCompleted: true });
      await dbService.updateStats(cur => ({ ap: cur.ap + reward }));
      director.onEvent({ type: 'task-completed', apEarned: reward });
      showNotify('+' + reward + ' AP: Feat Complete!');
    }
  };

  const handleCompleteHabit = useCallback(async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const { adjustedAP, newDifficulty } = adjustHabitReward(habit);
      await dbService.updateHabitDB(habitId, { streak: habit.streak + 1, lastCompleted: Date.now(), difficulty: newDifficulty, skipCount: 0 });
      await dbService.updateStats(cur => ({ ap: cur.ap + adjustedAP }));
      director.onEvent({ type: 'habit-completed', apEarned: adjustedAP });
      showNotify('+' + adjustedAP + ' AP: Ritual Performed!');
    }
  }, [habits, showNotify]);

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
    await dbService.addHabitDB(habit);
    setNewHabit({ name: '', difficulty: 1 });
    setIsHabitCreatorOpen(false);
    showNotify('Ritual sealed!');
  };

  const handleStartQuest = (id: string) => {
     const q = quests.find(q => q.id === id);
     if (q) setGatedQuest(q);
  };

  const confirmStartQuest = async (quest: Quest) => {
    const cost = quest.requirements?.apQuota ?? 5;
    if (stats.ap >= cost) {
      await dbService.updateQuestDB(quest.id, { status: 'active' });
      await dbService.updateStats(cur => ({ ap: Math.max(0, cur.ap - cost) }));
      director.onEvent({ type: 'ap-spent', amount: cost });
      await dbService.updateCampaign({ activeQuestId: quest.id });
      setGatedQuest(null);
      showNotify('Embarking: ' + quest.title);
    } else {
      showNotify(`Need ${cost} AP to embark on this quest.`);
    }
  };

  const handleRecruit = (slot: 'front' | 'support') => {
    const actions = director.onEvent({
      type: 'recruit-requested', slot, party, gold: stats.gold, worldState: campaign.worldState,
    });
    for (const a of actions) {
      if (a.kind === 'recruit-member') {
        dbService.addPartyMemberDB(a.member);
        dbService.updateStats(cur => ({ gold: Math.max(0, cur.gold - a.cost) }));
        showNotify(`${a.member.name} joins the formation! (-${a.cost} gold)`);
      } else if (a.kind === 'deny') {
        showNotify(a.reason);
      }
    }
  };

  const handleDismiss = (memberId: string) => {
    const actions = director.onEvent({ type: 'dismiss-requested', memberId, party });
    for (const a of actions) {
      if (a.kind === 'dismiss-member') {
        dbService.removePartyMemberDB(a.memberId);
        showNotify(a.rationale);
      } else if (a.kind === 'deny') {
        showNotify(a.reason);
      }
    }
  };

  const handleWarHeal = (memberId: string, itemId: string) => {
    const member = party.find(m => m.id === memberId);
    const item = inventory.find(i => i.id === itemId);
    if (!member || !item) return;
    const plan = planHeal(item, member);
    if (!plan) return;
    dbService.updatePartyMemberDB(plan.memberId, { hp: plan.newHp });
    if (plan.removeItem) dbService.removeInventoryItemDB(plan.itemId);
    else dbService.updateInventoryItemDB(plan.itemId, { quantity: plan.newQuantity });
    showNotify(`${member.name} recovers ${plan.newHp - member.hp} HP`);
  };

  const handleWarRevive = (memberId: string, itemId: string) => {
    const member = party.find(m => m.id === memberId);
    const item = inventory.find(i => i.id === itemId);
    if (!member || !item) return;
    const plan = planRevive(item, member);
    if (!plan) return;
    dbService.updatePartyMemberDB(plan.memberId, { hp: plan.newHp });
    if (plan.removeItem) dbService.removeInventoryItemDB(plan.itemId);
    else dbService.updateInventoryItemDB(plan.itemId, { quantity: plan.newQuantity });
    showNotify(`${member.name} is revived (${plan.newHp} HP)`);
  };

  const handleWarEquip = (itemId: string, memberId: string) => {
    const item = inventory.find(i => i.id === itemId);
    const member = party.find(m => m.id === memberId);
    if (!item || !member) return;
    const plan = planEquip(item, memberId, inventory);
    if (plan.unequipItemId) dbService.updateInventoryItemDB(plan.unequipItemId, { equippedTo: undefined });
    dbService.updateInventoryItemDB(plan.itemId, { equippedTo: plan.memberId });
    dbService.updatePartyMemberDB(memberId, { equipment: { ...member.equipment, [plan.slot]: plan.displayName } });
    showNotify(`${member.name} equips ${item.name}`);
  };

  const handleWarUnequip = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    const plan = planUnequip(item);
    if (!plan) return;
    const member = party.find(m => m.id === plan.memberId);
    dbService.updateInventoryItemDB(plan.itemId, { equippedTo: undefined });
    if (member) dbService.updatePartyMemberDB(plan.memberId, { equipment: { ...member.equipment, [plan.slot]: undefined } });
    showNotify(`Unequipped ${item.name}`);
  };

  const [newGoal, setNewGoal] = useState({ name: '', target: 1000 });
  const [depositDrafts, setDepositDrafts] = useState<Record<string, string>>({});

  const handleAddSavingsGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || newGoal.target <= 0) return;
    await dbService.addSavingsGoalDB({ id: uuidv4(), name: newGoal.name, targetAmount: newGoal.target, currentAmount: 0 });
    setNewGoal({ name: '', target: 1000 });
    showNotify('Vault forged!');
  };

  const handleDeposit = async (goal: SavingsGoal, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    await dbService.updateSavingsGoalDB(goal.id, { currentAmount: goal.currentAmount + amount });
    setDepositDrafts(d => ({ ...d, [goal.id]: '' }));
    showNotify(`+${formatMoney(amount, stats.currency)} sealed into ${goal.name}`);
  };

  const handleResetGame = async () => {
    if (window.confirm('Start a New Game from scratch?\n\nALL progress will be permanently erased — expenses, quests, party growth, gold, budget and engine memory. You will start over at the very beginning, with the budget gate and tutorial reset.\n\nThis cannot be undone.')) {
      await dbService.resetGameDB();
      setCurrentTab('ledger');
      showNotify('A new adventure begins. Set your budget to start.');
    }
  };

  const [isBudgetEditorOpen, setIsBudgetEditorOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(stats.monthlyBudget || 3000);
  const [newCurrency, setNewCurrency] = useState(stats.currency || 'USD');

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.updateStats(() => ({ monthlyBudget: newBudget, currency: newCurrency }));
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
      
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} onResetGame={() => { setIsSettingsOpen(false); handleResetGame(); }} />}
      {gatedQuest && <QuestGater quest={gatedQuest} tasks={tasks} habits={habits} ap={stats.ap} onAccept={() => confirmStartQuest(gatedQuest)} onClose={() => setGatedQuest(null)} />}

      {isBudgetEditorOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
          <div className="w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <div className="tape-accent doodle-border bg-surface-container p-5 md:p-8 shadow-2xl">
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
                <div className="flex flex-col gap-2">
                  <span className="font-label text-[10px] uppercase text-on-surface-variant">Currency</span>
                  <select
                    className="w-full bg-surface doodle-border py-3 px-4 text-primary font-bold text-lg outline-none"
                    value={newCurrency}
                    onChange={e => setNewCurrency(e.target.value)}
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} ({c.symbol}) — {c.label}</option>
                    ))}
                  </select>
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
            <div className="tape-accent doodle-border bg-surface-container p-5 md:p-8 shadow-2xl"><ExpenseForm onAddExpense={handleAddExpense} /></div>
          </div>
        </div>
      )}

      {isTransmuteOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-surface/90 backdrop-blur-md">
          <div className="w-full max-w-lg relative animate-in zoom-in-95 duration-200">
            <button className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-surface-container-highest doodle-border z-10 flex items-center justify-center hover:scale-110 transition-transform" onClick={() => setIsTransmuteOpen(false)}><span className="material-symbols-outlined">close</span></button>
            <div className="tape-accent doodle-border bg-surface-container p-5 md:p-8 shadow-2xl">
               <h2 className="font-headline text-2xl font-bold text-primary mb-6 flex items-center gap-2"><img src="/assets/ui/Icon_GearWheels.png" className="w-8 h-8" /> Transmute Budget</h2>
               <div className="space-y-6">
                  {budgets.map(b => (
                    <div key={b.id} className="space-y-2">
                       <div className="flex justify-between font-label text-[10px] uppercase tracking-widest text-on-surface-variant"><span>{b.category}</span><span className="font-black text-on-surface">{formatMoney(b.allocatedAmount, stats.currency)}</span></div>
                       <input type="range" className="w-full accent-primary bg-surface-container-highest h-2 rounded-full appearance-none cursor-pointer" min="0" max="2000" step="50" value={b.allocatedAmount} onChange={(e) => dbService.updateBudgetStreamDB(b.id, { allocatedAmount: parseInt(e.target.value) })} />
                    </div>
                  ))}
               </div>
               <button onClick={() => setIsTransmuteOpen(false)} className="w-full mt-10 doodle-btn bg-primary text-on-primary font-headline font-black py-3 uppercase tracking-widest">Seal the Grimoire</button>
            </div>
          </div>
        </div>
      )}

      {isWarRoomOpen && <WarRoom party={party} inventory={inventory} recruitCost={recruitCost(party)} onClose={() => setIsWarRoomOpen(false)} onAddMember={handleRecruit} onRemoveMember={handleDismiss} onHeal={handleWarHeal} onRevive={handleWarRevive} onEquip={handleWarEquip} onUnequip={handleWarUnequip} />}
      {isVaultOpen && <GrandVault inventory={inventory} party={party} onClose={() => setIsVaultOpen(false)} />}

      <TopAppBar onOpenSettings={() => setIsSettingsOpen(true)} currentTab={currentTab} onTabChange={setCurrentTab} ap={stats.ap} />

      <main className="max-w-[1200px] mx-auto px-4 md:px-10 mt-6 md:mt-8 pb-32 md:pb-10">
        {currentTab === 'ledger' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div><h2 className="font-headline text-3xl font-bold text-primary doodle-underline inline-block mb-2">Personal Ledger</h2><p className="font-body text-lg text-on-surface-variant italic">Annotating financial flow.</p></div>
              <div className="flex gap-4"><button onClick={() => setIsScribeOpen(true)} className="bg-primary text-on-primary px-6 py-3 font-headline font-bold doodle-border hover:scale-105 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"><img src="/assets/ui/Icon_Gold.png" className="w-6 h-6" /> Scribe Expense</button></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 md:mb-12">
              <div onClick={() => { setNewBudget(totalIncome); setNewCurrency(stats.currency || 'USD'); setIsBudgetEditorOpen(true); }} className="bg-surface-container p-4 md:p-6 doodle-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group cursor-pointer hover:bg-primary/5 transition-all">
                <span className="font-label text-[10px] uppercase text-on-surface-variant flex justify-between">Monthly Budget <span className="material-symbols-outlined text-xs">edit</span></span>
                <div className="font-headline text-3xl font-black text-primary">{formatMoney(totalIncome, stats.currency)}</div>
              </div>
              <div className="bg-surface-container p-4 md:p-6 doodle-border shadow-[6px_6px_0px_0px_rgba(244,208,63,0.2)] flex flex-col justify-between group">
                <span className="font-label text-[10px] uppercase text-on-surface-variant">Total Expenses</span>
                <div className="font-headline text-3xl font-black text-secondary">{formatMoney(totalExpenses, stats.currency)}</div>
              </div>
              <div className={`bg-surface-container p-4 md:p-6 doodle-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group ${remainingBudget < 0 ? 'border-error animate-pulse' : ''}`}>
                <span className="font-label text-[10px] uppercase text-on-surface-variant">Remaining Safe</span>
                <div className={`font-headline text-3xl font-black ${remainingBudget < 0 ? 'text-error' : 'text-tertiary'}`}>{formatMoney(remainingBudget, stats.currency)}</div>
              </div>
            </div>
            <div className="bg-surface-container-low p-5 md:p-8 doodle-border shadow-xl"><ExpenseList expenses={expenses} currency={stats.currency} /></div>
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
                     <div className="tape-accent doodle-border bg-surface-container p-5 md:p-8 shadow-2xl">
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
                     <div className="tape-accent doodle-border bg-surface-container p-5 md:p-8 shadow-2xl">
                        <h3 className="font-headline text-2xl font-bold text-tertiary mb-6">New Ritual</h3>
                        <form onSubmit={handleAddHabit} className="space-y-6">
                           <input className="w-full bg-transparent pencil-line py-2 outline-none font-headline text-xl" type="text" placeholder="Ritual name..." value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})} required />
                           <button type="submit" className="w-full doodle-btn bg-tertiary text-on-tertiary py-3 font-headline font-black uppercase tracking-widest">Seal Ritual</button>
                        </form>
                     </div>
                  </div>
               </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
                <div className="lg:col-span-8 space-y-6 md:space-y-8">
                   <h3 className="font-headline text-2xl font-bold text-on-surface uppercase border-l-4 border-tertiary pl-4">Daily Rituals</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {habits.map(h => (
                        <div key={h.id} className="tape-accent doodle-border bg-surface-container p-4 md:p-6 hover:translate-y-[-4px] transition-transform group">
                           <div className="flex justify-between items-start mb-6">
                              <div><h4 className="font-headline text-xl font-bold group-hover:text-tertiary">{h.name}</h4><p className="text-[10px] font-label uppercase text-on-surface-variant">LV.{h.difficulty} RITUAL</p></div>
                              <div className="flex items-center gap-1 text-primary"><span className="font-headline text-lg font-black">{h.streak}</span><img src="/assets/ui/Icon_Energy_Green.png" className="w-4 h-4" /></div>
                           </div>
                           <button onClick={() => handleCompleteHabit(h.id)} className="w-full doodle-btn bg-tertiary text-on-tertiary py-3 font-headline font-black uppercase text-xs flex items-center justify-center gap-2 group-hover:scale-105 transition-all">Perform Ritual (+{adjustHabitReward(h).adjustedAP} AP)</button>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="lg:col-span-4 space-y-6 md:space-y-8">
                   <h3 className="font-headline text-2xl font-bold text-on-surface uppercase border-l-4 border-primary pl-4">One-Time Feats</h3>
                   <div className="space-y-4">
                      {tasks.filter(t => !t.isCompleted).map(t => (
                        <div key={t.id} onClick={() => handleCompleteTask(t.id)} className="bg-surface-container p-4 md:p-6 doodle-border hover:bg-surface-variant flex justify-between group cursor-pointer shadow-md">
                           <div><span className="font-headline text-lg font-bold text-on-surface block group-hover:text-primary">{t.title}</span><span className="font-label text-[8px] uppercase text-on-surface-variant">{t.isNecessity ? 'Vital' : 'Minor'} Feat</span></div>
                           <div className="text-right text-primary font-black">+{taskReward(t)} AP</div>
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
             <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                   <h1 className="font-headline text-2xl md:text-4xl font-black text-primary doodle-underline inline-block">Grand Archive</h1>
                   <p className="font-body text-sm text-on-surface-variant italic mt-2">Historical financial records and goal calibration.</p>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3 md:gap-4 w-full md:w-auto">
                  <button onClick={() => { setNewBudget(totalIncome); setNewCurrency(stats.currency || 'USD'); setIsBudgetEditorOpen(true); }} className="bg-surface-container px-4 py-2 doodle-border font-label text-[10px] uppercase font-black hover:text-primary transition-all flex items-center justify-center gap-2 shadow-md md:mb-1">
                    <span className="material-symbols-outlined text-sm">tune</span> Calibrate Budget
                  </button>
                  <div className="flex w-full md:w-auto bg-surface-container-high rounded-full p-1 doodle-border shadow-inner">
                    <button onClick={() => setArchiveTab('ledger')} className={`flex-1 md:flex-none px-1.5 md:px-6 py-2 rounded-full font-label text-[9px] md:text-[10px] uppercase tracking-tight md:tracking-widest whitespace-nowrap transition-all ${archiveTab === 'ledger' ? 'bg-primary text-on-primary font-black shadow-lg' : 'text-on-surface-variant font-bold hover:bg-surface-variant'}`}>Ledger</button>
                    <button onClick={() => setArchiveTab('budget')} className={`flex-1 md:flex-none px-1.5 md:px-6 py-2 rounded-full font-label text-[9px] md:text-[10px] uppercase tracking-tight md:tracking-widest whitespace-nowrap transition-all ${archiveTab === 'budget' ? 'bg-primary text-on-primary font-black shadow-lg' : 'text-on-surface-variant font-bold hover:bg-surface-variant'}`}>Streams</button>
                    <button onClick={() => setArchiveTab('savings')} className={`flex-1 md:flex-none px-1.5 md:px-6 py-2 rounded-full font-label text-[9px] md:text-[10px] uppercase tracking-tight md:tracking-widest whitespace-nowrap transition-all ${archiveTab === 'savings' ? 'bg-primary text-on-primary font-black shadow-lg' : 'text-on-surface-variant font-bold hover:bg-surface-variant'}`}>Vaults</button>
                    <button onClick={() => setArchiveTab('engine')} className={`flex-1 md:flex-none px-1.5 md:px-6 py-2 rounded-full font-label text-[9px] md:text-[10px] uppercase tracking-tight md:tracking-widest whitespace-nowrap transition-all ${archiveTab === 'engine' ? 'bg-primary text-on-primary font-black shadow-lg' : 'text-on-surface-variant font-bold hover:bg-surface-variant'}`}>Engine Log</button>
                  </div>
                </div>
             </div>
             <div className="bg-surface-container-low p-5 md:p-8 doodle-border shadow-2xl min-h-[600px]">
                {archiveTab === 'ledger' && <ExpenseList expenses={expenses} currency={stats.currency} />}
                {archiveTab === 'budget' && (
                  <div className="space-y-12">
                     <h3 className="font-headline text-2xl font-bold text-on-surface doodle-underline inline-block">Active Budget Streams</h3>
                     <div className="grid grid-cols-1 gap-5 md:gap-8">{budgets.map(b => {
                        const catTotal = expenses.filter(e => e.category === b.category).reduce((s, e) => s + e.amount, 0);
                        const perc = Math.min(100, (catTotal / b.allocatedAmount) * 100);
                        return (
                          <div key={b.id} className="bg-surface-container p-4 md:p-6 doodle-border group hover:bg-surface-container-high transition-colors">
                             <div className="flex justify-between items-end mb-4"><div><span className="font-label text-[10px] uppercase text-on-surface-variant">Stream: {b.category}</span><h4 className="font-headline text-2xl font-black text-on-surface">{formatMoney(catTotal, stats.currency)} <span className="text-sm font-normal text-on-surface-variant">of {formatMoney(b.allocatedAmount, stats.currency)}</span></h4></div><div className="text-right text-primary font-black">{Math.round(perc)}%</div></div>
                             <div className="h-4 w-full bg-surface/50 doodle-border p-0.5"><div className={`h-full transition-all duration-1000 ${perc > 90 ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${perc}%` }}></div></div>
                          </div>
                        );
                     })}</div>
                  </div>
                )}
                {archiveTab === 'savings' && (
                  <div className="space-y-12">
                     <div className="flex flex-wrap justify-between items-end gap-6">
                        <h3 className="font-headline text-2xl font-bold text-on-surface doodle-underline inline-block">Savings Vaults</h3>
                        <form onSubmit={handleAddSavingsGoal} className="flex flex-wrap items-end gap-3">
                           <input value={newGoal.name} onChange={e => setNewGoal(g => ({ ...g, name: e.target.value }))} placeholder="Vault name" className="bg-surface-container px-4 py-2 doodle-border font-body text-sm w-40 focus:outline-none focus:border-primary" />
                           <input type="number" min={1} value={newGoal.target} onChange={e => setNewGoal(g => ({ ...g, target: Number(e.target.value) }))} className="bg-surface-container px-4 py-2 doodle-border font-body text-sm w-28 focus:outline-none focus:border-primary" />
                           <button type="submit" className="bg-primary-container text-on-primary-container px-6 py-2 doodle-border font-label text-[10px] uppercase font-black hover:bg-primary hover:text-on-primary transition-all">Forge Vault</button>
                        </form>
                     </div>
                     {savings.length === 0 && <p className="font-body text-sm text-on-surface-variant italic">No vaults yet. Forge one to start saving toward a goal.</p>}
                     <div className="grid grid-cols-1 gap-5 md:gap-8">{savings.map(g => {
                        const perc = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
                        const done = g.currentAmount >= g.targetAmount;
                        return (
                          <div key={g.id} className="bg-surface-container p-4 md:p-6 doodle-border group hover:bg-surface-container-high transition-colors">
                             <div className="flex justify-between items-end mb-4">
                                <div>
                                   <span className="font-label text-[10px] uppercase text-on-surface-variant">Vault: {g.name}{done ? ' — SEALED' : ''}</span>
                                   <h4 className="font-headline text-2xl font-black text-on-surface">{formatMoney(g.currentAmount, stats.currency)} <span className="text-sm font-normal text-on-surface-variant">of {formatMoney(g.targetAmount, stats.currency)}</span></h4>
                                </div>
                                <div className={`text-right font-black ${done ? 'text-tertiary' : 'text-primary'}`}>{Math.round(perc)}%</div>
                             </div>
                             <div className="h-4 w-full bg-surface/50 doodle-border p-0.5 mb-4"><div className={`h-full transition-all duration-1000 ${done ? 'bg-tertiary' : 'bg-primary'}`} style={{ width: `${perc}%` }}></div></div>
                             {!done && (
                               <form onSubmit={e => { e.preventDefault(); handleDeposit(g, Number(depositDrafts[g.id])); }} className="flex items-center gap-3">
                                  <input type="number" min={1} value={depositDrafts[g.id] ?? ''} onChange={e => setDepositDrafts(d => ({ ...d, [g.id]: e.target.value }))} placeholder="Amount" className="bg-surface-container-low px-4 py-2 doodle-border font-body text-sm w-32 focus:outline-none focus:border-primary" />
                                  <button type="submit" className="bg-surface-container-high px-6 py-2 doodle-border font-label text-[10px] uppercase font-black hover:bg-primary hover:text-on-primary transition-all">Deposit</button>
                               </form>
                             )}
                          </div>
                        );
                     })}</div>
                  </div>
                )}
                {archiveTab === 'engine' && (
                  <div className="space-y-8">
                     <div>
                        <h3 className="font-headline text-2xl font-bold text-on-surface doodle-underline inline-block">Engine Log</h3>
                        <p className="font-body text-sm text-on-surface-variant italic mt-2">Every Game Director decision — observe, infer, decide, act. Newest first.</p>
                     </div>
                     {traces.length === 0 && <p className="font-body text-sm text-on-surface-variant italic">The Director has made no decisions yet. Play a little.</p>}
                     <div className="space-y-6">{[...traces].reverse().map(t => (
                        <div key={t.id} className="bg-surface-container p-4 md:p-6 doodle-border space-y-4">
                           <div className="flex flex-wrap justify-between items-baseline gap-2">
                              <span className="font-headline font-black text-primary">{t.act}</span>
                              <span className="font-label text-[10px] uppercase text-on-surface-variant">{new Date(t.timestamp).toLocaleString()}</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div><span className="font-label text-[10px] uppercase tracking-widest text-secondary block mb-1">Observe</span><p className="font-body text-sm text-on-surface">{t.observe}</p></div>
                              <div><span className="font-label text-[10px] uppercase tracking-widest text-secondary block mb-1">Infer</span><p className="font-body text-sm text-on-surface">{t.infer}</p></div>
                              <div><span className="font-label text-[10px] uppercase tracking-widest text-secondary block mb-1">Decide</span><p className="font-body text-sm text-on-surface">{t.decide}</p></div>
                           </div>
                           <p className="font-body text-sm text-on-surface-variant italic border-l-4 border-primary/30 pl-4">{t.rationale}</p>
                        </div>
                     ))}</div>
                  </div>
                )}
             </div>
          </div>
        )}

        {currentTab === 'quests' && (
          <div className="animate-in zoom-in-95 duration-500 lg:h-[calc(100vh-10rem)] lg:min-h-[560px] flex flex-col gap-4 md:gap-6">
             <div className="flex flex-wrap justify-between items-end gap-4">
                <div><h1 className="font-headline text-2xl font-black text-primary mb-1 doodle-underline inline-block">Strategic Map</h1><p className="font-body text-sm text-on-surface-variant italic hidden sm:block">Expend AP to navigate.</p></div>
                <div className="flex gap-4">
                   <button onClick={() => setIsWarRoomOpen(true)} className="bg-surface-container-high text-on-surface px-6 py-2 doodle-border font-label text-[10px] uppercase font-black hover:bg-primary transition-all">War Room</button>
                   <button onClick={() => setIsVaultOpen(true)} className="bg-surface-container-high text-on-surface px-6 py-2 doodle-border font-label text-[10px] uppercase font-black hover:bg-primary transition-all">Vault</button>
                </div>
             </div>
             <div className="flex-grow min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 lg:overflow-hidden">
                <div className="lg:col-span-9 bg-[#0a0f1a] relative overflow-hidden shadow-2xl rounded-2xl h-[70vh] min-h-[420px] lg:h-auto lg:min-h-0">
                   {isPlayUnlocked(stats, profile) ? (
                   <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-on-surface-variant font-label text-[10px] uppercase tracking-widest">Summoning world…</div>}>
                   <GameView 
                  stats={stats} 
                  campaign={campaign} 
                  party={party} 
                  inventory={inventory}
                  onTravel={handleTravel}
                  onTalk={handleTalk}
                  onBattleVictory={handleBattleVictory}
                  onBattleDefeat={handleBattleDefeat}
                  onBattleAction={handleBattleAction}
                  onActionCost={handleActionCost}
                  onShopPurchase={handleShopPurchase}
                  onEnterTown={handleEnterTown}
                  onExitTown={handleExitTown}
                  onInvasionFight={handleInvasionFight}
                  onInvasionEscape={handleInvasionEscape}
                /></Suspense>
                   ) : (
                   <OnboardingGate
                     step={currentOnboardingStep(stats, profile)}
                     onSetBudget={() => { setCurrentTab('ledger'); setNewBudget(totalIncome); setNewCurrency(stats.currency || 'USD'); setIsBudgetEditorOpen(true); }}
                     onGoLog={() => setCurrentTab('ledger')}
                   />
                   )}</div>
                <div className="lg:col-span-3 lg:overflow-y-auto pr-4 custom-scrollbar"><QuestList quests={quests} onStartQuest={handleStartQuest} onClaimReward={handleClaimReward} /></div>
             </div>
          </div>
        )}
      </main>

      <div className="mb-24 md:mb-0"><DemoFooter /></div>
      <footer className="fixed bottom-0 left-0 w-full z-50 p-4 md:p-6 md:hidden"><div className="bg-surface-container doodle-border shadow-2xl flex justify-around p-4 backdrop-blur-md"><button onClick={() => setCurrentTab('ledger')} className={`material-symbols-outlined ${currentTab === 'ledger' ? 'text-primary' : 'text-on-surface-variant'}`}>dashboard</button><button onClick={() => setCurrentTab('trials')} className={`material-symbols-outlined ${currentTab === 'trials' ? 'text-primary' : 'text-on-surface-variant'}`}>history_edu</button><button onClick={() => setCurrentTab('archive')} className={`material-symbols-outlined ${currentTab === 'archive' ? 'text-primary' : 'text-on-surface-variant'}`}>menu_book</button><button onClick={() => setCurrentTab('quests')} className={`material-symbols-outlined ${currentTab === 'quests' ? 'text-primary' : 'text-on-surface-variant'}`}>explore</button></div></footer>
    </div>
  );
}

export default App;
