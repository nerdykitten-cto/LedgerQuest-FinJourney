import { describe, it, expect } from 'vitest';
import { dayTick } from './dayTick';
import type { Habit, BudgetStream } from '../types/schemas';

// Noon timestamps avoid DST edge cases in local-time day math.
const day = (d: number, month = 6, year = 2026) => new Date(year, month, d, 12).getTime();

const mkHabit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  name: 'Daily Expense Logging',
  streak: 4,
  lastCompleted: 0,
  skipCount: 0,
  difficulty: 2,
  ...over,
});

const mkBudget = (over: Partial<BudgetStream> = {}): BudgetStream => ({
  id: 'b1',
  category: 'Food',
  allocatedAmount: 500,
  spentAmount: 120,
  ...over,
});

describe('dayTick', () => {
  it('does nothing on first boot (lastSeen 0)', () => {
    const habits = [mkHabit()];
    const res = dayTick({ lastSeen: 0, now: day(4), habits, budgets: [mkBudget()] });
    expect(res.changed).toBe(false);
    expect(res.missedDays).toBe(0);
    expect(res.habits).toEqual(habits);
  });

  it('does nothing when lastSeen is the same calendar day', () => {
    const res = dayTick({
      lastSeen: new Date(2026, 6, 4, 8).getTime(),
      now: new Date(2026, 6, 4, 22).getTime(),
      habits: [mkHabit()],
      budgets: [mkBudget()],
    });
    expect(res.changed).toBe(false);
    expect(res.missedDays).toBe(0);
  });

  it('increments skipCount per missed day and resets streak', () => {
    const res = dayTick({
      lastSeen: day(1),
      now: day(4),
      habits: [mkHabit({ lastCompleted: 0, streak: 4, skipCount: 1 })],
      budgets: [],
    });
    // Days 1, 2, 3 passed without completion.
    expect(res.missedDays).toBe(3);
    expect(res.habits[0].skipCount).toBe(4);
    expect(res.habits[0].streak).toBe(0);
    expect(res.changed).toBe(true);
  });

  it('does not count a day the habit was completed on', () => {
    const res = dayTick({
      lastSeen: day(3),
      now: day(4),
      habits: [mkHabit({ lastCompleted: day(3), streak: 5, skipCount: 0 })],
      budgets: [],
    });
    expect(res.habits[0].skipCount).toBe(0);
    expect(res.habits[0].streak).toBe(5);
  });

  it('counts only uncompleted days in a multi-day gap', () => {
    const res = dayTick({
      lastSeen: day(2),
      now: day(4),
      habits: [mkHabit({ lastCompleted: day(2), streak: 3, skipCount: 0 })],
      budgets: [],
    });
    // Day 2 completed, day 3 missed.
    expect(res.habits[0].skipCount).toBe(1);
    expect(res.habits[0].streak).toBe(0);
  });

  it('flags month rollover and resets budget spentAmount', () => {
    const res = dayTick({
      lastSeen: day(30, 5), // 2026-06-30
      now: day(2, 6), // 2026-07-02
      habits: [],
      budgets: [mkBudget({ spentAmount: 480 })],
    });
    expect(res.monthRolled).toBe(true);
    expect(res.budgets[0].spentAmount).toBe(0);
  });

  it('does not flag month rollover within the same month', () => {
    const res = dayTick({
      lastSeen: day(1),
      now: day(4),
      habits: [],
      budgets: [mkBudget({ spentAmount: 480 })],
    });
    expect(res.monthRolled).toBe(false);
    expect(res.budgets[0].spentAmount).toBe(480);
  });

  it('does not mutate its inputs', () => {
    const habits = [mkHabit({ streak: 4, skipCount: 0 })];
    const budgets = [mkBudget({ spentAmount: 480 })];
    dayTick({ lastSeen: day(30, 5), now: day(2, 6), habits, budgets });
    expect(habits[0].streak).toBe(4);
    expect(habits[0].skipCount).toBe(0);
    expect(budgets[0].spentAmount).toBe(480);
  });

  it('produces a rationale describing what happened', () => {
    const res = dayTick({
      lastSeen: day(1),
      now: day(4),
      habits: [mkHabit()],
      budgets: [],
    });
    expect(res.rationale).toMatch(/3/);
  });
});
