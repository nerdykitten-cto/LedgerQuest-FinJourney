/**
 * FINANCE SCHEMAS
 */

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  timestamp: number;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  type: 'digital' | 'physical';
  frequency: 'monthly' | 'yearly';
  nextBillingDate: number;
}

export interface Earning {
  id: string;
  source: string;
  amount: number;
  timestamp: number;
}

export interface FinanceTask {
  id: string;
  title: string;
  description: string;
  isNecessity: boolean; // e.g., Grocery shopping
  baseAPReward: number;
  isCompleted: boolean;
  deadline?: number;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  lastCompleted: number; // Timestamp
  skipCount: number; // Used by Value Adjuster to increase rewards
  difficulty: number; // 1-10
}

/**
 * RPG SCHEMAS
 */

export interface PlayerStats {
  level: number;
  exp: number;
  ap: number; // Action Points (Earned via Finance Tasks/Habits)
  gold: number;
}

export interface PartyMember {
  id: string;
  name: string;
  role: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  equipment: {
    weapon?: string;
    armor?: string;
  };
}

export interface CampaignState {
  currentLocation: string;
  progressPercentage: number;
  activeQuestId?: string;
  worldState: 'peace' | 'battle' | 'puzzle';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side';
  difficulty: number;
  reward: {
    exp: number;
    gold: number;
    items?: string[];
  };
  status: 'available' | 'active' | 'completed' | 'failed';
}

export interface Encounter {
  id: string;
  type: 'dialogue' | 'battle' | 'puzzle' | 'minigame';
  description: string; // The situation text
  options: {
    text: string;
    apCost: number;
    action: string; // Reference to a result or state change
  }[];
}

/**
 * LOGIC ENGINE TRACES
 */

export interface LogicEngineTrace {
  timestamp: number;
  type: 'AP_EVALUATOR' | 'VALUE_ADJUSTER';
  input: any;
  rationale: string;
  output: any;
}
