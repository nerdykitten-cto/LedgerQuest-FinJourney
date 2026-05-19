import type { Expense, PlayerStats, Quest, AntigravityTrace } from './types/schemas';
import { v4 as uuidv4 } from 'uuid';

/**
 * Antigravity Narrative & Difficulty Agent
 * Implements the Observe -> Infer -> Decide -> Act loop.
 */
export class AntigravityAgent {
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  /**
   * Generates a new quest based on player financial behavior and stats.
   */
  async generateQuest(expenses: Expense[], stats: PlayerStats): Promise<{ quest: Quest; trace: AntigravityTrace }> {
    // 1. OBSERVE
    const observation = {
      recentExpenses: expenses.slice(-5),
      currentStats: stats
    };

    // 2. INFER (Logic to be replaced by actual AI/Antigravity call)
    // Placeholder logic: If they spent a lot on "Food", generate a "Food Goblin" quest.
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const categoryCounts = expenses.reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});
    
    const topCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, 'None');
    
    const inference = {
      spendingPattern: totalSpent > 1000 ? 'high' : 'normal',
      primaryConcern: topCategory,
      boredomRisk: stats.level < 5 ? 'low' : 'medium'
    };

    // 3. DECIDE
    const difficulty = Math.min(stats.level + (inference.spendingPattern === 'high' ? 1 : 0), 10);
    const questTitle = `The ${topCategory} Menace`;
    const questDescription = `A monster representing your ${topCategory} spending has appeared! Defeat it to reclaim your savings.`;

    const decision = {
      targetDifficulty: difficulty,
      questTheme: topCategory
    };

    // 4. ACT
    const quest: Quest = {
      id: uuidv4(),
      title: questTitle,
      description: questDescription,
      type: 'side',
      difficulty: difficulty,
      reward: {
        exp: difficulty * 100,
        gold: difficulty * 50
      },
      status: 'available'
    };

    const trace: AntigravityTrace = {
      timestamp: Date.now(),
      agentId: this.agentId,
      observe: observation,
      infer: inference,
      decide: decision,
      act: quest
    };

    return { quest, trace };
  }
}
