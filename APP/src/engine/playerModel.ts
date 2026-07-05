/**
 * Persisted player signal tracker. Pure functions over a PlayerSignals value;
 * the director owns loading/saving it through the persistence service.
 */

export interface PlayerSignals {
  // EWMA rates, 0..1 where applicable
  combatWinRate: number;
  taskCompletionRate: number;
  habitCompletionRate: number;
  avgStrikesToWin: number;
  potionsPerBattle: number;
  budgetPace: number; // spend vs pro-rated budget, 1.0 = exactly on pace
  sessionGapDays: number;
  // Raw counters
  logStreak: number; // consecutive days with at least one expense logged
  battlesFought: number;
  lossStreak: number;
  apEarnedTotal: number;
  apSpentTotal: number;
  daysActive: number;
}

export const DEFAULT_ALPHA = 0.3;

export const ewma = (prev: number, value: number, alpha: number = DEFAULT_ALPHA): number =>
  prev + alpha * (value - prev);

export const defaultSignals = (): PlayerSignals => ({
  combatWinRate: 0.5,
  taskCompletionRate: 0.5,
  habitCompletionRate: 0.5,
  avgStrikesToWin: 0,
  potionsPerBattle: 0,
  budgetPace: 1.0,
  sessionGapDays: 0,
  logStreak: 0,
  battlesFought: 0,
  lossStreak: 0,
  apEarnedTotal: 0,
  apSpentTotal: 0,
  daysActive: 1,
});

export interface BattleOutcome {
  won: boolean;
  strikes: number;
  potionsUsed: number;
}

export const recordBattle = (s: PlayerSignals, b: BattleOutcome): PlayerSignals => ({
  ...s,
  combatWinRate: ewma(s.combatWinRate, b.won ? 1 : 0),
  avgStrikesToWin: b.won ? ewma(s.avgStrikesToWin || b.strikes, b.strikes) : s.avgStrikesToWin,
  potionsPerBattle: ewma(s.potionsPerBattle, b.potionsUsed),
  battlesFought: s.battlesFought + 1,
  lossStreak: b.won ? 0 : s.lossStreak + 1,
});

export const recordHabit = (s: PlayerSignals, completed: boolean): PlayerSignals => ({
  ...s,
  habitCompletionRate: ewma(s.habitCompletionRate, completed ? 1 : 0),
});

export const recordTask = (s: PlayerSignals, completed: boolean): PlayerSignals => ({
  ...s,
  taskCompletionRate: ewma(s.taskCompletionRate, completed ? 1 : 0),
});

/** daysSinceLastLog: 0 = already logged today, 1 = consecutive day, >1 = streak broken. */
export const recordExpenseLog = (s: PlayerSignals, daysSinceLastLog: number): PlayerSignals => {
  if (daysSinceLastLog === 0) return s;
  return {
    ...s,
    logStreak: daysSinceLastLog === 1 ? s.logStreak + 1 : 1,
  };
};

export const recordAp = (
  s: PlayerSignals,
  delta: { earned?: number; spent?: number }
): PlayerSignals => ({
  ...s,
  apEarnedTotal: s.apEarnedTotal + (delta.earned ?? 0),
  apSpentTotal: s.apSpentTotal + (delta.spent ?? 0),
});

export const recordSessionGap = (s: PlayerSignals, gapDays: number): PlayerSignals => ({
  ...s,
  sessionGapDays: ewma(s.sessionGapDays, gapDays),
  daysActive: s.daysActive + gapDays,
});

export const recordBudgetPace = (s: PlayerSignals, paceRatio: number): PlayerSignals => ({
  ...s,
  budgetPace: ewma(s.budgetPace, paceRatio),
});

export const avgApEarnedPerDay = (s: PlayerSignals): number =>
  s.apEarnedTotal / Math.max(1, s.daysActive);
