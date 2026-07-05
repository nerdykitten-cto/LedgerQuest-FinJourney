import { describe, it, expect } from 'vitest';
import {
  defaultSignals,
  ewma,
  recordBattle,
  recordHabit,
  recordTask,
  recordExpenseLog,
  recordAp,
  recordSessionGap,
  avgApEarnedPerDay,
} from './playerModel';

describe('ewma', () => {
  it('blends new value toward previous with alpha weight', () => {
    expect(ewma(0, 1, 0.3)).toBeCloseTo(0.3);
    expect(ewma(1, 1, 0.3)).toBeCloseTo(1);
    expect(ewma(10, 0, 0.5)).toBeCloseTo(5);
  });
});

describe('defaultSignals', () => {
  it('starts neutral: 50% rates, zero counters', () => {
    const s = defaultSignals();
    expect(s.combatWinRate).toBeCloseTo(0.5);
    expect(s.taskCompletionRate).toBeCloseTo(0.5);
    expect(s.habitCompletionRate).toBeCloseTo(0.5);
    expect(s.battlesFought).toBe(0);
    expect(s.lossStreak).toBe(0);
    expect(s.apEarnedTotal).toBe(0);
    expect(s.daysActive).toBe(1);
  });
});

describe('recordBattle', () => {
  it('a win raises win rate, tracks strikes and potions, resets loss streak', () => {
    const s0 = { ...defaultSignals(), lossStreak: 2 };
    const s1 = recordBattle(s0, { won: true, strikes: 4, potionsUsed: 1 });
    expect(s1.combatWinRate).toBeGreaterThan(s0.combatWinRate);
    expect(s1.avgStrikesToWin).toBeGreaterThan(0);
    expect(s1.potionsPerBattle).toBeGreaterThan(0);
    expect(s1.battlesFought).toBe(1);
    expect(s1.lossStreak).toBe(0);
  });

  it('a loss lowers win rate and increments loss streak', () => {
    const s0 = defaultSignals();
    const s1 = recordBattle(s0, { won: false, strikes: 6, potionsUsed: 0 });
    expect(s1.combatWinRate).toBeLessThan(s0.combatWinRate);
    expect(s1.lossStreak).toBe(1);
  });

  it('does not mutate input', () => {
    const s0 = defaultSignals();
    recordBattle(s0, { won: true, strikes: 3, potionsUsed: 0 });
    expect(s0.battlesFought).toBe(0);
  });
});

describe('habit / task / expense signals', () => {
  it('completed habit raises habitCompletionRate; skipped lowers it', () => {
    const s0 = defaultSignals();
    expect(recordHabit(s0, true).habitCompletionRate).toBeGreaterThan(0.5);
    expect(recordHabit(s0, false).habitCompletionRate).toBeLessThan(0.5);
  });

  it('completed task raises taskCompletionRate', () => {
    const s0 = defaultSignals();
    expect(recordTask(s0, true).taskCompletionRate).toBeGreaterThan(0.5);
  });

  it('expense log on consecutive day extends streak, gap resets it', () => {
    const s0 = { ...defaultSignals(), logStreak: 3 };
    expect(recordExpenseLog(s0, 1).logStreak).toBe(4);
    expect(recordExpenseLog(s0, 0).logStreak).toBe(3); // same day, unchanged
    expect(recordExpenseLog(s0, 3).logStreak).toBe(1); // gap: restart at 1
  });
});

describe('AP economy tracking', () => {
  it('accumulates earn/spend totals and derives daily average', () => {
    let s = defaultSignals();
    s = recordAp(s, { earned: 8 });
    s = recordAp(s, { earned: 10, spent: 5 });
    expect(s.apEarnedTotal).toBe(18);
    expect(s.apSpentTotal).toBe(5);
    expect(avgApEarnedPerDay(s)).toBeCloseTo(18); // 1 day active
  });

  it('daily average divides by daysActive', () => {
    let s = { ...defaultSignals(), daysActive: 3 };
    s = recordAp(s, { earned: 30 });
    expect(avgApEarnedPerDay(s)).toBeCloseTo(10);
  });
});

describe('recordSessionGap', () => {
  it('EWMAs the gap and bumps daysActive by the gap days', () => {
    const s0 = defaultSignals();
    const s1 = recordSessionGap(s0, 2);
    expect(s1.sessionGapDays).toBeGreaterThan(s0.sessionGapDays);
    expect(s1.daysActive).toBe(s0.daysActive + 2);
  });
});
