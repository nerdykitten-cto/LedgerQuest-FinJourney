import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { Expense, PlayerStats, Quest, AntigravityTrace } from './types/schemas';

/**
 * TOGGLE THIS FLAG TO SWITCH BETWEEN LOCAL AND FIREBASE
 */
const USE_FIREBASE = false; 

const EXPENSES_COL = 'expenses';
const QUESTS_COL = 'quests';
const STATS_DOC = 'player/stats';
const TRACES_COL = 'traces';

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
    const expenses = getLocal(EXPENSES_COL);
    callback(expenses);
    return () => {}; // No-op cleanup
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

export const addExpenseDB = async (expense: Expense) => {
  if (USE_FIREBASE) {
    await addDoc(collection(db, EXPENSES_COL), expense);
  } else {
    const expenses = [expense, ...getLocal(EXPENSES_COL)];
    setLocal(EXPENSES_COL, expenses);
    window.dispatchEvent(new Event('storage')); // Trigger update
  }
};

export const addQuestDB = async (quest: Quest) => {
  if (USE_FIREBASE) {
    await setDoc(doc(db, QUESTS_COL, quest.id), quest);
  } else {
    const quests = [quest, ...getLocal(QUESTS_COL).filter((q: any) => q.id !== quest.id)];
    setLocal(QUESTS_COL, quests);
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
    const statsRef = doc(db, STATS_DOC);
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      await updateDoc(statsRef, updates);
    }
  } else {
    const stats = JSON.parse(localStorage.getItem(STATS_DOC) || 'null') || { level: 1, exp: 0, ap: 10, gold: 0 };
    const newStats = { ...stats, ...updates };
    localStorage.setItem(STATS_DOC, JSON.stringify(newStats));
    window.dispatchEvent(new Event('storage'));
  }
};

export const addTraceDB = async (trace: AntigravityTrace) => {
  if (USE_FIREBASE) {
    await addDoc(collection(db, TRACES_COL), trace);
  } else {
    const traces = [trace, ...getLocal(TRACES_COL)];
    setLocal(TRACES_COL, traces);
  }
};
