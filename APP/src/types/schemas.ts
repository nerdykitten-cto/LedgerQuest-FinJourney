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

export interface Budget {
  category: string;
  limit: number;
  spent: number;
}

/**
 * RPG SCHEMAS
 */

export interface PlayerStats {
  level: number;
  exp: number;
  ap: number; // Action Points (earned from finance habits)
  gold: number;
}

export interface PartyMember {
  id: string;
  name: string;
  role: string;
  level: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  reward: {
    exp: number;
    gold: number;
    items?: string[];
  };
  status: 'available' | 'active' | 'completed' | 'failed';
}

/**
 * ANTIGRAVITY O-I-D-A TRACE
 */

export interface AntigravityTrace {
  timestamp: number;
  agentId: string;
  observe: any; // Raw input (e.g., last 3 days of expenses)
  infer: any;   // Interpretation (e.g., "Player is overspending on food, high boredom risk")
  decide: any;  // Action chosen (e.g., "Generate food-related monster quest with high reward")
  act: any;     // Resulting data (e.g., the Quest object)
}
