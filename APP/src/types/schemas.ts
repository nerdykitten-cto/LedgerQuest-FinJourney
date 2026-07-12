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

export interface BudgetStream {
  id: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
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
  monthlyBudget?: number;
  currency?: string; // finance-side display currency code (item 2); default USD
}

export interface PartyMember {
  id: string;
  name: string;
  avatar: string; // URL to avatar image
  role: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  equipment: {
    weapon?: string;
    armor?: string;
    helmet?: string;
    shield?: string;
    gloves?: string;
  };
}


export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  archetype?: 'Aggressor' | 'Tactician' | 'Opportunist';
}

export interface CampaignState {
  currentLocation: string;
  progressPercentage: number;
  activeQuestId?: string;
  worldState: 'peace' | 'battle' | 'puzzle' | 'town';
  activeEnemy?: Enemy;
  battleOrigin?: 'town' | 'map' | 'invasion'; // where a battle was entered from -> where victory/defeat returns
  invasion?: { town: string; questId: string; bossName: string }; // chronicle boss invading a town; presence = town locked
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
  status: 'available' | 'active' | 'ready' | 'completed' | 'failed' | 'gated';
  requirements?: {
    apQuota: number;
    taskCount: number;
    habitCount: number;
  };
  objectives?: {
    id: string;
    text: string;
    type: 'talk' | 'kill' | 'travel';
    target: string; // NPC ID, Enemy Type, or Location
    isCompleted: boolean;
  }[];
}

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  reward: {
    exp: number;
    gold: number;
    items?: string[];
  };
}

export interface Chapter {
  id: string;
  title: string;
  minProgress: number;
  location: string;
  mainQuests: QuestTemplate[];
  sideQuests: QuestTemplate[];
}

export interface StoryManifest {
  chapters: Chapter[];
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
  id?: string;
  timestamp: number;
  type: 'AP_EVALUATOR' | 'VALUE_ADJUSTER' | 'STORY_TELLING_ENGINE';
  input: unknown;
  rationale: string;
  output: unknown;
}

/** Which equipment slot an item occupies (Phase 5.5 — data-driven slotting). */
export type EquipSlot = 'weapon' | 'armor' | 'helmet' | 'shield' | 'gloves';

export interface InventoryItem {
  id: string;
  templateId: string;
  name: string;
  type: 'Consumable' | 'Equipment' | 'Quest';
  slot?: EquipSlot; // Only meaningful for type:'Equipment'; legacy items derive a fallback.
  icon: string; // Material symbols icon identifier
  sprite?: string; // Image path (e.g., /assets/ui/... or /assets/game/weapons/...)
  description: string;
  stats?: string; // Display text e.g. "+15 Attack"
  statBonus?: {
    attack?: number;
    defense?: number;
    hpHeal?: number;
    revive?: number;
  };
  weight: number;
  quantity: number;
  equippedTo?: string; // PartyMember ID
}
