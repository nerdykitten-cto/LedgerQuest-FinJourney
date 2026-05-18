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
  CampaignState
} from './types/schemas';

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

// --- HELPER: LOCAL STORAGE ---
const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// --- UNIFIED PERSISTENCE API ---

export const subscribeExpenses = (callback: (expenses: Expense[]) => void) => {
  if (USE_FIREBASE) {
    const q = query(collection(db, EXPENSES_COL), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      callback(expenses);
    });
  } else {
    callback(getLocal(EXPENSES_COL));
    return () => {};
  }
};

export const subscribeQuests = (callback: (quests: Quest[]) => void) => {
  if (USE_FIREBASE) {
    return onSnapshot(collection(db, QUESTS_COL), (snapshot) => {
      const quests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quest));
      callback(quests);
    });
  } else {
    callback(getLocal(QUESTS_COL));
    return () => {};
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
    const stats = JSON.parse(localStorage.getItem(STATS_DOC) || 'null') || { level: 1, exp: 0, ap: 10, gold: 0 };
    callback(stats);
    return () => {};
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
    const state = JSON.parse(localStorage.getItem(CAMPAIGN_DOC) || 'null') || { currentLocation: 'Start Town', progressPercentage: 0, worldState: 'peace' };
    callback(state);
    return () => {};
  }
};

export const updateCampaign = async (updates: Partial<CampaignState>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, CAMPAIGN_DOC), updates);
  } else {
    const current = JSON.parse(localStorage.getItem(CAMPAIGN_DOC) || 'null') || { currentLocation: 'Start Town', progressPercentage: 0, worldState: 'peace' };
    localStorage.setItem(CAMPAIGN_DOC, JSON.stringify({ ...current, ...updates }));
    window.dispatchEvent(new Event('storage'));
  }
};

// Generic Adders
export const addExpenseDB = async (expense: Expense) => {
  if (USE_FIREBASE) await addDoc(collection(db, EXPENSES_COL), expense);
  else {
    setLocal(EXPENSES_COL, [expense, ...getLocal(EXPENSES_COL)]);
    window.dispatchEvent(new Event('storage'));
  }
};

export const addQuestDB = async (quest: Quest) => {
  if (USE_FIREBASE) await setDoc(doc(db, QUESTS_COL, quest.id), quest);
  else {
    setLocal(QUESTS_COL, [quest, ...getLocal(QUESTS_COL).filter((q: any) => q.id !== quest.id)]);
    window.dispatchEvent(new Event('storage'));
  }
};

export const updateQuestDB = async (questId: string, updates: Partial<Quest>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, QUESTS_COL, questId), updates);
  } else {
    const quests = getLocal(QUESTS_COL).map((q: any) => q.id === questId ? { ...q, ...updates } : q);
    setLocal(QUESTS_COL, quests);
    window.dispatchEvent(new Event('storage'));
  }
};

export const updateStatsDB = async (updates: Partial<PlayerStats>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, STATS_DOC), updates);
  } else {
    const current = JSON.parse(localStorage.getItem(STATS_DOC) || 'null') || { level: 1, exp: 0, ap: 10, gold: 0 };
    localStorage.setItem(STATS_DOC, JSON.stringify({ ...current, ...updates }));
    window.dispatchEvent(new Event('storage'));
  }
};

export const addTraceDB = async (trace: LogicEngineTrace) => {
  if (USE_FIREBASE) await addDoc(collection(db, TRACES_COL), trace);
  else {
    setLocal(TRACES_COL, [trace, ...getLocal(TRACES_COL)]);
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
    callback(getLocal(TRACES_COL));
    return () => {};
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
    callback(getLocal(SUBS_COL));
    return () => {};
  }
};

export const addSubscriptionDB = async (sub: Subscription) => {
  if (USE_FIREBASE) await addDoc(collection(db, SUBS_COL), sub);
  else {
    setLocal(SUBS_COL, [sub, ...getLocal(SUBS_COL)]);
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
    callback(getLocal(TASKS_COL));
    return () => {};
  }
};

export const updateTaskDB = async (taskId: string, updates: Partial<FinanceTask>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, TASKS_COL, taskId), updates);
  } else {
    const tasks = getLocal(TASKS_COL).map((t: any) => t.id === taskId ? { ...t, ...updates } : t);
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
    callback(getLocal(HABITS_COL));
    return () => {};
  }
};

export const updateHabitDB = async (habitId: string, updates: Partial<Habit>) => {
  if (USE_FIREBASE) {
    await updateDoc(doc(db, HABITS_COL, habitId), updates);
  } else {
    const habits = getLocal(HABITS_COL).map((h: any) => h.id === habitId ? { ...h, ...updates } : h);
    setLocal(HABITS_COL, habits);
    window.dispatchEvent(new Event('storage'));
  }
};

// MOCK DATA INITIALIZATION
export const initializeLocalData = () => {
  if (USE_FIREBASE) return;
  
  if (getLocal(TASKS_COL).length === 0) {
    const initialTasks: FinanceTask[] = [
      { id: 't1', title: 'Grocery Shopping List', description: 'Plan essential groceries for the week.', isNecessity: true, baseAPReward: 10, isCompleted: false },
      { id: 't2', title: 'Review Subscriptions', description: 'Check for any unwanted digital renewals.', isNecessity: false, baseAPReward: 5, isCompleted: false },
    ];
    setLocal(TASKS_COL, initialTasks);
  }

  if (getLocal(HABITS_COL).length === 0) {
    const initialHabits: Habit[] = [
      { id: 'h1', name: 'Daily Expense Logging', streak: 0, lastCompleted: 0, skipCount: 0, difficulty: 1 },
    ];
    setLocal(HABITS_COL, initialHabits);
  }

  if (getLocal(QUESTS_COL).length === 0) {
    const initialQuests: Quest[] = [
      { id: 'q1', title: 'The Grocery Goblin', description: 'A small creature is raiding your pantry! Defeat it by planning your budget.', type: 'main', difficulty: 2, reward: { exp: 200, gold: 100 }, status: 'available' }
    ];
    setLocal(QUESTS_COL, initialQuests);
  }
};
