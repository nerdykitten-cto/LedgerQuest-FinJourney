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
   * Evaluates financial wins and grants Action Points (AP).
   */
  evaluateFinancialWin(expenses: Expense[]): { apGained: number; reason: string } {
    // Simple logic: If latest expense is low amount, or if total today is low.
    const today = new Date().setHours(0, 0, 0, 0);
    const todayExpenses = expenses.filter(e => e.timestamp >= today);
    const totalToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (totalToday < 50) {
      return { apGained: 5, reason: 'Frugal Day! You stayed under $50.' };
    } else if (totalToday < 100) {
      return { apGained: 2, reason: 'Moderate spending. Small AP boost.' };
    }
    return { apGained: 0, reason: 'High spending day. No AP earned.' };
  }

  /**
   * Generates a new quest based on player financial behavior and stats.
   */
  async generateQuest(expenses: Expense[], stats: PlayerStats): Promise<{ quest: Quest; trace: AntigravityTrace; rewardNotification?: string }> {
    // 1. OBSERVE
    const financialWin = this.evaluateFinancialWin(expenses);
    const observation = {
      recentExpenses: expenses.slice(-5),
      currentStats: stats,
      financialWin
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
