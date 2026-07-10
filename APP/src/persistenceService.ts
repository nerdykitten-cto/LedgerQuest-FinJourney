import type {
  Expense,
  PlayerStats,
  Quest,
  Subscription,
  FinanceTask,
  Habit,
  CampaignState,
  PartyMember,
  BudgetStream,
  SavingsGoal,
  InventoryItem
} from './types/schemas';
import storyManifest from './data/storyManifest.json';
import { PARTY_ART } from './assets/placeholders';

import { ENGINE_STATE_KEYS } from './engine/director';
import type { DirectorTrace } from './engine/traceHub';

/**
 * Persistence is localStorage-only. Firebase/Firestore was removed for v1
 * (see PLANS/OverhaulPlan.md Phase 4). Same-tab reactivity is driven by a
 * manual `window.dispatchEvent(new Event('storage'))` after every write.
 */

const EXPENSES_COL = 'expenses';
const QUESTS_COL = 'quests';
const STATS_DOC = 'player/stats';
const CAMPAIGN_DOC = 'player/campaign';
const TRACES_COL = 'traces';
const SUBS_COL = 'subscriptions';
const TASKS_COL = 'tasks';
const HABITS_COL = 'habits';
const PARTY_COL = 'party';
const BUDGET_COL = 'budget';
const SAVINGS_COL = 'savings';
const INVENTORY_COL = 'inventory';

// --- HELPER: LOCAL STORAGE ---
const getLocal = (key: string): unknown => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: unknown) => localStorage.setItem(key, JSON.stringify(data));

// --- UNIFIED PERSISTENCE API ---

export const subscribeBudgetStreams = (callback: (streams: BudgetStream[]) => void) => {
  const handler = () => callback(getLocal(BUDGET_COL) as BudgetStream[]);
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const updateBudgetStreamDB = async (streamId: string, updates: Partial<BudgetStream>) => {
  const streams = (getLocal(BUDGET_COL) as BudgetStream[]).map(s => s.id === streamId ? { ...s, ...updates } : s);
  setLocal(BUDGET_COL, streams);
  window.dispatchEvent(new Event('storage'));
};

export const subscribeSavingsGoals = (callback: (goals: SavingsGoal[]) => void) => {
  const handler = () => callback(getLocal(SAVINGS_COL) as SavingsGoal[]);
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const addSavingsGoalDB = async (goal: SavingsGoal) => {
  setLocal(SAVINGS_COL, [...getLocal(SAVINGS_COL) as SavingsGoal[], goal]);
  window.dispatchEvent(new Event('storage'));
};

export const updateSavingsGoalDB = async (goalId: string, updates: Partial<SavingsGoal>) => {
  const goals = (getLocal(SAVINGS_COL) as SavingsGoal[]).map(g => g.id === goalId ? { ...g, ...updates } : g);
  setLocal(SAVINGS_COL, goals);
  window.dispatchEvent(new Event('storage'));
};

export const subscribeExpenses = (callback: (expenses: Expense[]) => void) => {
  const handler = () => callback(getLocal(EXPENSES_COL) as Expense[]);
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const subscribeQuests = (callback: (quests: Quest[]) => void) => {
  const handler = () => callback(getLocal(QUESTS_COL) as Quest[]);
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const subscribeStats = (callback: (stats: PlayerStats) => void) => {
  const handler = () => {
    const raw = localStorage.getItem(STATS_DOC);
    const stats = raw ? (JSON.parse(raw) as PlayerStats) : { level: 1, exp: 0, ap: 10, gold: 0, monthlyBudget: 3000 };
    callback(stats);
  };
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const subscribeCampaign = (callback: (state: CampaignState) => void) => {
  const handler = () => {
    const raw = localStorage.getItem(CAMPAIGN_DOC);
    const state = raw ? (JSON.parse(raw) as CampaignState) : { currentLocation: 'Starting Village', progressPercentage: 0, worldState: 'peace' as const };
    // Legacy saves used 'Start Town', which is not a map node and caused a phantom travel charge.
    if (state.currentLocation === 'Start Town') state.currentLocation = 'Starting Village';
    callback(state as CampaignState);
  };
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const updateCampaign = async (updates: Partial<CampaignState>) => {
  const raw = localStorage.getItem(CAMPAIGN_DOC);
  const current = raw ? (JSON.parse(raw) as CampaignState) : { currentLocation: 'Starting Village', progressPercentage: 0, worldState: 'peace' as const };
  localStorage.setItem(CAMPAIGN_DOC, JSON.stringify({ ...current, ...updates }));
  window.dispatchEvent(new Event('storage'));
};

// Generic Adders
export const addExpenseDB = async (expense: Expense) => {
  setLocal(EXPENSES_COL, [expense, ...getLocal(EXPENSES_COL) as Expense[]]);
  window.dispatchEvent(new Event('storage'));
};

export const addQuestDB = async (quest: Quest) => {
  setLocal(QUESTS_COL, [quest, ...(getLocal(QUESTS_COL) as Quest[]).filter(q => q.id !== quest.id)]);
  window.dispatchEvent(new Event('storage'));
};

export const updateQuestDB = async (questId: string, updates: Partial<Quest>) => {
  const quests = (getLocal(QUESTS_COL) as Quest[]).map(q => q.id === questId ? { ...q, ...updates } : q);
  setLocal(QUESTS_COL, quests);
  window.dispatchEvent(new Event('storage'));
};

const DEFAULT_STATS: PlayerStats = { level: 1, exp: 0, ap: 10, gold: 0 };

/**
 * Functional stat update: the updater receives the CURRENT persisted stats,
 * so concurrent callers can't clobber each other with stale React snapshots.
 */
export const updateStats = async (updater: (current: PlayerStats) => Partial<PlayerStats>) => {
  const raw = localStorage.getItem(STATS_DOC);
  const current = raw ? (JSON.parse(raw) as PlayerStats) : DEFAULT_STATS;
  localStorage.setItem(STATS_DOC, JSON.stringify({ ...current, ...updater(current) }));
  window.dispatchEvent(new Event('storage'));
};

// New collections
export const subscribeEngineTraces = (callback: (traces: DirectorTrace[]) => void) => {
  const handler = () => {
    const raw = localStorage.getItem('engine_traces');
    try {
      callback(raw ? (JSON.parse(raw) as DirectorTrace[]) : []);
    } catch {
      callback([]);
    }
  };
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const subscribeSubscriptions = (callback: (subs: Subscription[]) => void) => {
  const handler = () => callback(getLocal(SUBS_COL) as Subscription[]);
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const addSubscriptionDB = async (sub: Subscription) => {
  setLocal(SUBS_COL, [sub, ...getLocal(SUBS_COL) as Subscription[]]);
  window.dispatchEvent(new Event('storage'));
};

export const subscribeTasks = (callback: (tasks: FinanceTask[]) => void) => {
  const handler = () => callback(getLocal(TASKS_COL) as FinanceTask[]);
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const addTaskDB = async (task: FinanceTask) => {
  setLocal(TASKS_COL, [task, ...getLocal(TASKS_COL) as FinanceTask[]]);
  window.dispatchEvent(new Event('storage'));
};

export const updateTaskDB = async (taskId: string, updates: Partial<FinanceTask>) => {
  const tasks = (getLocal(TASKS_COL) as FinanceTask[]).map(t => t.id === taskId ? { ...t, ...updates } : t);
  setLocal(TASKS_COL, tasks);
  window.dispatchEvent(new Event('storage'));
};

export const subscribeHabits = (callback: (habits: Habit[]) => void) => {
  const handler = () => callback(getLocal(HABITS_COL) as Habit[]);
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const addHabitDB = async (habit: Habit) => {
  setLocal(HABITS_COL, [...getLocal(HABITS_COL) as Habit[], habit]);
  window.dispatchEvent(new Event('storage'));
};

export const updateHabitDB = async (habitId: string, updates: Partial<Habit>) => {
  const habits = (getLocal(HABITS_COL) as Habit[]).map(h => h.id === habitId ? { ...h, ...updates } : h);
  setLocal(HABITS_COL, habits);
  window.dispatchEvent(new Event('storage'));
};

export const subscribeParty = (callback: (members: PartyMember[]) => void) => {
  const handler = () => callback(getLocal(PARTY_COL) as PartyMember[]);
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const addPartyMemberDB = async (member: PartyMember) => {
  setLocal(PARTY_COL, [...getLocal(PARTY_COL) as PartyMember[], member]);
  window.dispatchEvent(new Event('storage'));
};

export const updatePartyMemberDB = async (memberId: string, updates: Partial<PartyMember>) => {
  const party = (getLocal(PARTY_COL) as PartyMember[]).map(m =>
    m.id === memberId ? { ...m, ...updates } : m
  );
  setLocal(PARTY_COL, party);
  window.dispatchEvent(new Event('storage'));
};

export const removePartyMemberDB = async (memberId: string) => {
  setLocal(PARTY_COL, (getLocal(PARTY_COL) as PartyMember[]).filter(m => m.id !== memberId));
  window.dispatchEvent(new Event('storage'));
};

export const subscribeInventory = (callback: (items: InventoryItem[]) => void) => {
  const handler = () => callback(getLocal(INVENTORY_COL) as InventoryItem[]);
  window.addEventListener('storage', handler);
  handler();
  return () => window.removeEventListener('storage', handler);
};

export const addInventoryItemDB = async (item: InventoryItem) => {
  const items = getLocal(INVENTORY_COL) as InventoryItem[];
  setLocal(INVENTORY_COL, [...items, item]);
  window.dispatchEvent(new Event('storage'));
};

export const updateInventoryItemDB = async (itemId: string, updates: Partial<InventoryItem>) => {
  const items = (getLocal(INVENTORY_COL) as InventoryItem[]).map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  setLocal(INVENTORY_COL, items);
  window.dispatchEvent(new Event('storage'));
};

export const removeInventoryItemDB = async (itemId: string) => {
  const items = (getLocal(INVENTORY_COL) as InventoryItem[]).filter(item => item.id !== itemId);
  setLocal(INVENTORY_COL, items);
  window.dispatchEvent(new Event('storage'));
};

export const resetGameDB = async () => {
  localStorage.removeItem(EXPENSES_COL);
  localStorage.removeItem(QUESTS_COL);
  localStorage.removeItem(STATS_DOC);
  localStorage.removeItem(CAMPAIGN_DOC);
  localStorage.removeItem(TRACES_COL);
  localStorage.removeItem(SUBS_COL);
  localStorage.removeItem(TASKS_COL);
  localStorage.removeItem(HABITS_COL);
  localStorage.removeItem(PARTY_COL);
  localStorage.removeItem(BUDGET_COL);
  localStorage.removeItem(SAVINGS_COL);
  localStorage.removeItem(INVENTORY_COL);
  ENGINE_STATE_KEYS.forEach(k => localStorage.removeItem(k));

  initializeLocalData();
  window.dispatchEvent(new Event('storage'));
};

// MOCK DATA INITIALIZATION
export const initializeLocalData = () => {
  if ((getLocal(TASKS_COL) as FinanceTask[]).length === 0) {
    const initialTasks: FinanceTask[] = [
      { id: 't1', title: 'Grocery Shopping List', description: 'Plan essential groceries for the week.', isNecessity: true, baseAPReward: 10, isCompleted: false },
      { id: 't2', title: 'Review Subscriptions', description: 'Check for any unwanted digital renewals.', isNecessity: false, baseAPReward: 5, isCompleted: false },
    ];
    setLocal(TASKS_COL, initialTasks);
  }

  if ((getLocal(HABITS_COL) as Habit[]).length === 0) {
    const initialHabits: Habit[] = [
      { id: 'h1', name: 'Daily Expense Logging', streak: 0, lastCompleted: 0, skipCount: 0, difficulty: 1 },
    ];
    setLocal(HABITS_COL, initialHabits);
  }

  if ((getLocal(QUESTS_COL) as Quest[]).length === 0) {
    const q0 = storyManifest.chapters[0].mainQuests[0];
    const initialQuests: Quest[] = [
      { ...q0, type: 'main', status: 'available', requirements: { apQuota: 5, taskCount: 0, habitCount: 0 } } as Quest
    ];
    setLocal(QUESTS_COL, initialQuests);
  }

  if ((getLocal(PARTY_COL) as PartyMember[]).length === 0) {
    const initialParty: PartyMember[] = [
      { id: 'p1', name: 'Althea', avatar: PARTY_ART.p1, role: 'Leader', hp: 100, maxHp: 100, mp: 20, maxMp: 20, level: 1, equipment: {} },
      { id: 'p2', name: 'Kael', avatar: PARTY_ART.p2, role: 'Vanguard', hp: 120, maxHp: 120, mp: 10, maxMp: 10, level: 1, equipment: {} },
      { id: 'p3', name: 'Elora', avatar: PARTY_ART.p3, role: 'Arcanist', hp: 80, maxHp: 80, mp: 50, maxMp: 50, level: 1, equipment: {} }
    ];
    setLocal(PARTY_COL, initialParty);
  }

  if ((getLocal(INVENTORY_COL) as InventoryItem[]).length === 0) {
    const initialItems: InventoryItem[] = [
      {
        id: 'init-w1',
        templateId: 'iron-sword',
        name: 'Budget Slicer',
        type: 'Equipment',
        icon: 'swords',
        sprite: '/assets/game/weapons/gear_right_26.png',
        description: 'A keen blade used to trim unnecessary expenses.',
        stats: '+10 Attack',
        statBonus: { attack: 10 },
        weight: 3.0,
        quantity: 1
      },
      {
        id: 'init-p1',
        templateId: 'health-potion',
        name: 'Health Potion',
        type: 'Consumable',
        icon: 'science',
        description: 'Restores 40 HP.',
        stats: '+40 HP',
        statBonus: { hpHeal: 40 },
        weight: 0.5,
        quantity: 3
      }
    ];
    setLocal(INVENTORY_COL, initialItems);
  }

  if ((getLocal(BUDGET_COL) as BudgetStream[]).length === 0) {
    const initialBudgets: BudgetStream[] = [
      { id: 'b1', category: 'Food', allocatedAmount: 500, spentAmount: 0 },
      { id: 'b2', category: 'Transport', allocatedAmount: 200, spentAmount: 0 },
      { id: 'b3', category: 'Entertainment', allocatedAmount: 300, spentAmount: 0 },
      { id: 'b4', category: 'Bills', allocatedAmount: 1000, spentAmount: 0 },
    ];
    setLocal(BUDGET_COL, initialBudgets);
  }

  if ((getLocal(SAVINGS_COL) as SavingsGoal[]).length === 0) {
    const initialSavings: SavingsGoal[] = [
      { id: 's1', name: 'Summer Cabin', targetAmount: 25000, currentAmount: 12400 },
    ];
    setLocal(SAVINGS_COL, initialSavings);
  }
};
