import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  Expense, 
  PlayerStats, 
  Quest, 
  LogicEngineTrace, 
  Subscription, 
  FinanceTask, 
  Habit,
  CampaignState,
  PartyMember,
  BudgetStream,
  SavingsGoal
} from './types/schemas';
import storyManifest from './data/storyManifest.json';

/**
 * TOGGLE THIS FLAG TO SWITCH BETWEEN LOCAL AND FIREBASE
 */
const USE_FIREBASE = false; 

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

// --- HELPER: LOCAL STORAGE ---
const getLocal = (key: string): unknown => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: unknown) => localStorage.setItem(key, JSON.stringify(data));

// --- UNIFIED PERSISTENCE API ---

export const subscribeBudgetStreams = (callback: (streams: BudgetStream[]) => void) => {
  if (USE_BASE_FIREBASE()) {
    return onSnapshot(collection(db, BUDGET_COL), (snapshot) => {
      const streams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetStream));
      callback(streams);
    });
  } else {
    const handler = () => callback(getLocal(BUDGET_COL) as BudgetStream[]);
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

const USE_BASE_FIREBASE = () => USE_FIREBASE;

export const updateBudgetStreamDB = async (streamId: string, updates: Partial<BudgetStream>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, BUDGET_COL, streamId), updates);
  } else {
    const streams = (getLocal(BUDGET_COL) as BudgetStream[]).map(s => s.id === streamId ? { ...s, ...updates } : s);
    setLocal(BUDGET_COL, streams);
    window.dispatchEvent(new Event('storage'));
  }
};

export const subscribeSavingsGoals = (callback: (goals: SavingsGoal[]) => void) => {
  if (USE_FIREBASE) {
    return onSnapshot(collection(db, SAVINGS_COL), (snapshot) => {
      const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsGoal));
      callback(goals);
    });
  } else {
    const handler = () => callback(getLocal(SAVINGS_COL) as SavingsGoal[]);
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

export const updateSavingsGoalDB = async (goalId: string, updates: Partial<SavingsGoal>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, SAVINGS_COL, goalId), updates);
  } else {
    const goals = (getLocal(SAVINGS_COL) as SavingsGoal[]).map(g => g.id === goalId ? { ...g, ...updates } : g);
    setLocal(SAVINGS_COL, goals);
    window.dispatchEvent(new Event('storage'));
  }
};

export const subscribeExpenses = (callback: (expenses: Expense[]) => void) => {
  if (USE_FIREBASE) {
    const q = query(collection(db, EXPENSES_COL), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      callback(expenses);
    });
  } else {
    const handler = () => callback(getLocal(EXPENSES_COL) as Expense[]);
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

export const subscribeQuests = (callback: (quests: Quest[]) => void) => {
  if (USE_FIREBASE) {
    return onSnapshot(collection(db, QUESTS_COL), (snapshot) => {
      const quests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quest));
      callback(quests);
    });
  } else {
    const handler = () => callback(getLocal(QUESTS_COL) as Quest[]);
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

export const subscribeStats = (callback: (stats: PlayerStats) => void) => {
  if (USE_FIREBASE) {
    return onSnapshot(doc(db, STATS_DOC), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as PlayerStats);
      } else {
        const initialStats: PlayerStats = { level: 1, exp: 0, ap: 10, gold: 0 };
        setDoc(doc(db, STATS_DOC), initialStats);
        callback(initialStats);
      }
    });
  } else {
    const handler = () => {
      const raw = localStorage.getItem(STATS_DOC);
      const stats = raw ? (JSON.parse(raw) as PlayerStats) : { level: 1, exp: 0, ap: 10, gold: 0, monthlyBudget: 3000 };
      callback(stats);
    };
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

export const subscribeCampaign = (callback: (state: CampaignState) => void) => {
  if (USE_FIREBASE) {
    return onSnapshot(doc(db, CAMPAIGN_DOC), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as CampaignState);
      } else {
        const initial: CampaignState = { currentLocation: 'Start Town', progressPercentage: 0, worldState: 'peace' };
        setDoc(doc(db, CAMPAIGN_DOC), initial);
        callback(initial);
      }
    });
  } else {
    const handler = () => {
      const raw = localStorage.getItem(CAMPAIGN_DOC);
      const state = raw ? (JSON.parse(raw) as CampaignState) : { currentLocation: 'Start Town', progressPercentage: 0, worldState: 'peace' as const };
      callback(state as CampaignState);
    };
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

export const updateCampaign = async (updates: Partial<CampaignState>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, CAMPAIGN_DOC), updates);
  } else {
    const raw = localStorage.getItem(CAMPAIGN_DOC);
    const current = raw ? (JSON.parse(raw) as CampaignState) : { currentLocation: 'Start Town', progressPercentage: 0, worldState: 'peace' as const };
    localStorage.setItem(CAMPAIGN_DOC, JSON.stringify({ ...current, ...updates }));
    window.dispatchEvent(new Event('storage'));
  }
};

// Generic Adders
export const addExpenseDB = async (expense: Expense) => {
  if (USE_FIREBASE) await addDoc(collection(db, EXPENSES_COL), expense);
  else {
    setLocal(EXPENSES_COL, [expense, ...getLocal(EXPENSES_COL) as Expense[]]);
    window.dispatchEvent(new Event('storage'));
  }
};

export const addQuestDB = async (quest: Quest) => {
  if (USE_FIREBASE) await setDoc(doc(db, QUESTS_COL, quest.id), quest);
  else {
    setLocal(QUESTS_COL, [quest, ...(getLocal(QUESTS_COL) as Quest[]).filter(q => q.id !== quest.id)]);
    window.dispatchEvent(new Event('storage'));
  }
};

export const updateQuestDB = async (questId: string, updates: Partial<Quest>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, QUESTS_COL, questId), updates);
  } else {
    const quests = (getLocal(QUESTS_COL) as Quest[]).map(q => q.id === questId ? { ...q, ...updates } : q);
    setLocal(QUESTS_COL, quests);
    window.dispatchEvent(new Event('storage'));
  }
};

export const updateStatsDB = async (updates: Partial<PlayerStats>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, STATS_DOC), updates);
  } else {
    const raw = localStorage.getItem(STATS_DOC);
    const current = raw ? (JSON.parse(raw) as PlayerStats) : { level: 1, exp: 0, ap: 10, gold: 0 };
    localStorage.setItem(STATS_DOC, JSON.stringify({ ...current, ...updates }));
    window.dispatchEvent(new Event('storage'));
  }
};

export const addTraceDB = async (trace: LogicEngineTrace) => {
  if (USE_FIREBASE) await addDoc(collection(db, TRACES_COL), trace);
  else {
    setLocal(TRACES_COL, [trace, ...getLocal(TRACES_COL) as LogicEngineTrace[]]);
    window.dispatchEvent(new Event('storage'));
  }
};

export const subscribeTraces = (callback: (traces: LogicEngineTrace[]) => void) => {
  if (USE_FIREBASE) {
    const q = query(collection(db, TRACES_COL), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const traces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as LogicEngineTrace));
      callback(traces);
    });
  } else {
    const handler = () => callback(getLocal(TRACES_COL) as LogicEngineTrace[]);
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

// New collections
export const subscribeSubscriptions = (callback: (subs: Subscription[]) => void) => {
  if (USE_FIREBASE) {
    return onSnapshot(collection(db, SUBS_COL), (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      callback(subs);
    });
  } else {
    const handler = () => callback(getLocal(SUBS_COL) as Subscription[]);
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

export const addSubscriptionDB = async (sub: Subscription) => {
  if (USE_FIREBASE) await addDoc(collection(db, SUBS_COL), sub);
  else {
    setLocal(SUBS_COL, [sub, ...getLocal(SUBS_COL) as Subscription[]]);
    window.dispatchEvent(new Event('storage'));
  }
};

export const subscribeTasks = (callback: (tasks: FinanceTask[]) => void) => {
  if (USE_FIREBASE) {
    return onSnapshot(collection(db, TASKS_COL), (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceTask));
      callback(tasks);
    });
  } else {
    const handler = () => callback(getLocal(TASKS_COL) as FinanceTask[]);
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

export const addTaskDB = async (task: FinanceTask) => {
  if (USE_FIREBASE) {
    await setDoc(doc(db, TASKS_COL, task.id), task);
  } else {
    setLocal(TASKS_COL, [task, ...getLocal(TASKS_COL) as FinanceTask[]]);
    window.dispatchEvent(new Event('storage'));
  }
};

export const updateTaskDB = async (taskId: string, updates: Partial<FinanceTask>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, TASKS_COL, taskId), updates);
  } else {
    const tasks = (getLocal(TASKS_COL) as FinanceTask[]).map(t => t.id === taskId ? { ...t, ...updates } : t);
    setLocal(TASKS_COL, tasks);
    window.dispatchEvent(new Event('storage'));
  }
};

export const subscribeHabits = (callback: (habits: Habit[]) => void) => {
  if (USE_FIREBASE) {
    return onSnapshot(collection(db, HABITS_COL), (snapshot) => {
      const habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
      callback(habits);
    });
  } else {
    const handler = () => callback(getLocal(HABITS_COL) as Habit[]);
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

export const updateHabitDB = async (habitId: string, updates: Partial<Habit>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, HABITS_COL, habitId), updates);
  } else {
    const habits = (getLocal(HABITS_COL) as Habit[]).map(h => h.id === habitId ? { ...h, ...updates } : h);
    setLocal(HABITS_COL, habits);
    window.dispatchEvent(new Event('storage'));
  }
};

export const subscribeParty = (callback: (members: PartyMember[]) => void) => {
  if (USE_FIREBASE) {
    return onSnapshot(collection(db, PARTY_COL), (snapshot) => {
      const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartyMember));
      callback(members);
    });
  } else {
    const handler = () => callback(getLocal(PARTY_COL) as PartyMember[]);
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
};

export const addPartyMemberDB = async (member: PartyMember) => {
  if (USE_FIREBASE) await setDoc(doc(db, PARTY_COL, member.id), member);
  else {
    setLocal(PARTY_COL, [...getLocal(PARTY_COL) as PartyMember[], member]);
    window.dispatchEvent(new Event('storage'));
  }
};

export const updatePartyMemberDB = async (memberId: string, equipment: any) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, PARTY_COL, memberId), { equipment });
  } else {
    const party = (getLocal(PARTY_COL) as PartyMember[]).map(m => 
      m.id === memberId ? { ...m, equipment: { ...m.equipment, ...equipment } } : m
    );
    setLocal(PARTY_COL, party);
    window.dispatchEvent(new Event('storage'));
  }
};

export const resetGameDB = async () => {
  if (USE_FIREBASE) {
    console.warn('Reset not fully implemented for Firebase in this demo.');
  } else {
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
    
    initializeLocalData();
    window.dispatchEvent(new Event('storage'));
  }
};

// MOCK DATA INITIALIZATION
export const initializeLocalData = () => {
  if (USE_FIREBASE) return;
  
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
      { ...q0, type: 'main', status: 'available' } as Quest
    ];
    setLocal(QUESTS_COL, initialQuests);
  }

  if ((getLocal(PARTY_COL) as PartyMember[]).length === 0) {
    const initialParty: PartyMember[] = [
      { id: 'p1', name: 'Hero', role: 'Warrior', hp: 100, maxHp: 100, mp: 20, maxMp: 20, level: 1, equipment: {} }
    ];
    setLocal(PARTY_COL, initialParty);
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
