import type { 
  FinanceTask, 
  Habit, 
  LogicEngineTrace,
  Encounter
} from './types/schemas';

/**
 * AP EVALUATOR SCRIPT
 * Handles reward assignment for finance tasks and cost calculation for game actions.
 */
export class APEvaluator {
  /**
   * Assigns AP rewards to a finance task based on necessity and difficulty.
   */
  evaluateTaskReward(task: FinanceTask): number {
    let reward = task.baseAPReward;
    if (task.isNecessity) {
      reward *= 1.5; // Necessities grant 50% more AP
    }
    return Math.round(reward);
  }

  /**
   * Calculates the AP cost for a game action.
   */
  calculateActionCost(type: Encounter['type']): number {
    switch (type) {
      case 'dialogue': return 1;
      case 'battle': return 3;
      case 'puzzle': return 2;
      case 'minigame': return 5;
      default: return 1;
    }
  }

  /**
   * Calculates travel cost between two points (simulated).
   */
  calculateTravelCost(distance: number): number {
    return Math.max(1, Math.floor(distance / 10));
  }
}

/**
 * DIFFICULTY & VALUE ADJUSTER SCRIPT
 * Monitors habits and adjusts rewards/difficulty to maintain engagement.
 */
export class ValueAdjuster {
  /**
   * Adjusts a habit's rewards and difficulty based on skip counts and streaks.
   */
  adjustHabit(habit: Habit): { adjustedAP: number; newDifficulty: number; rationale: string } {
    let multiplier = 1.0;
    let newDifficulty = habit.difficulty;
    let rationale = '';

    // Incentive Loop: Increase reward if skipped
    if (habit.skipCount > 0) {
      multiplier += (habit.skipCount * 0.2);
      rationale = `Incentive: Reward increased by ${habit.skipCount * 20}% due to skips. `;
    }

    // Momentum Loop: Lower difficulty if skipping too much
    if (habit.skipCount >= 3) {
      newDifficulty = Math.max(1, habit.difficulty - 1);
      rationale += `Momentum: Difficulty lowered to help you restart. `;
    }

    // Challenge Loop: Increase difficulty for high streaks
    if (habit.streak >= 5) {
      newDifficulty = Math.min(10, habit.difficulty + 1);
      multiplier += 0.1;
      rationale += `Challenge: Difficulty increased for your ${habit.streak}-day streak! `;
    }

    const baseReward = 10; // Default base for habits
    const adjustedAP = Math.round(baseReward * multiplier);

    return { adjustedAP, newDifficulty, rationale };
  }

  /**
   * Generates a trace for the logic engine audit.
   */
  generateTrace(type: 'AP_EVALUATOR' | 'VALUE_ADJUSTER', input: any, rationale: string, output: any): LogicEngineTrace {
    return {
      timestamp: Date.now(),
      type,
      input,
      rationale,
      output
    };
  }
}
