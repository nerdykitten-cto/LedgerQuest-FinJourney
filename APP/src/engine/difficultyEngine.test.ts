import { describe, it, expect } from 'vitest';
import {
  skillScore,
  difficultyMultiplier,
  scaleEnemy,
  adjustHabitReward,
} from './difficultyEngine';
import { defaultSignals, type PlayerSignals } from './playerModel';
import type { Enemy, Habit } from '../types/schemas';

const strong: PlayerSignals = {
  ...defaultSignals(),
  combatWinRate: 0.9,
  taskCompletionRate: 0.9,
  habitCompletionRate: 0.9,
  logStreak: 7,
  budgetPace: 0.8,
  potionsPerBattle: 0,
};

const weak: PlayerSignals = {
  ...defaultSignals(),
  combatWinRate: 0.2,
  taskCompletionRate: 0.2,
  habitCompletionRate: 0.2,
  logStreak: 0,
  budgetPace: 1.8,
  potionsPerBattle: 2,
};

const baseEnemy: Enemy = { id: 'e1', name: 'Debt Gnome', hp: 50, maxHp: 50, attack: 5, defense: 2 };

const mkHabit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1', name: 'Log expenses', streak: 0, lastCompleted: 0, skipCount: 0, difficulty: 3, ...over,
});

describe('skillScore', () => {
  it('is ~0.5 for neutral default signals', () => {
    const s = skillScore(defaultSignals());
    expect(s).toBeGreaterThan(0.35);
    expect(s).toBeLessThan(0.65);
  });

  it('ranks a strong player above a weak player, both clamped to 0..1', () => {
    expect(skillScore(strong)).toBeGreaterThan(skillScore(weak));
    expect(skillScore(strong)).toBeLessThanOrEqual(1);
    expect(skillScore(weak)).toBeGreaterThanOrEqual(0);
  });
});

describe('difficultyMultiplier', () => {
  it('gives strong players a higher multiplier than weak players', () => {
    expect(difficultyMultiplier(strong).multiplier).toBeGreaterThan(
      difficultyMultiplier(weak).multiplier
    );
  });

  it('stays within [0.75, 1.6]', () => {
    expect(difficultyMultiplier(strong).multiplier).toBeLessThanOrEqual(1.6);
    expect(difficultyMultiplier(weak).multiplier).toBeGreaterThanOrEqual(0.75);
  });

  it('clamps a deeply-struggling player up to the 0.75 floor', () => {
    // Raw pre-clamp value for this input is 0.5625 (skill 0.325 -> 1.0625,
    // -0.10 below-band, -0.40 pity for 5 losses), so the floor genuinely bites.
    expect(
      difficultyMultiplier({ ...defaultSignals(), combatWinRate: 0, lossStreak: 5 }).multiplier
    ).toBe(0.75);
  });

  it('mentions the target band when win rate is above 65%', () => {
    const d = difficultyMultiplier({ ...defaultSignals(), combatWinRate: 0.8 });
    expect(d.rationale.toLowerCase()).toContain('win rate');
  });

  it('applies a pity reduction on a loss streak', () => {
    const base = difficultyMultiplier({ ...defaultSignals(), combatWinRate: 0.4 });
    const pitied = difficultyMultiplier({
      ...defaultSignals(),
      combatWinRate: 0.4,
      lossStreak: 3,
    });
    expect(pitied.multiplier).toBeLessThan(base.multiplier);
    expect(pitied.rationale.toLowerCase()).toContain('pity');
  });
});

describe('scaleEnemy', () => {
  it('scales hp and attack up for strong players', () => {
    const { enemy } = scaleEnemy(baseEnemy, strong);
    expect(enemy.hp).toBeGreaterThan(baseEnemy.hp);
    expect(enemy.attack).toBeGreaterThan(baseEnemy.attack);
    expect(enemy.defense).toBeGreaterThan(baseEnemy.defense);
    expect(enemy.maxHp).toBe(enemy.hp);
  });

  it('scales down for weak players but never below survivable floors', () => {
    const { enemy } = scaleEnemy(baseEnemy, weak);
    expect(enemy.hp).toBeLessThan(baseEnemy.hp);
    expect(enemy.hp).toBeGreaterThanOrEqual(10);
    expect(enemy.attack).toBeGreaterThanOrEqual(1);
  });

  it('returns a rationale and does not mutate the base enemy', () => {
    const { rationale } = scaleEnemy(baseEnemy, strong);
    expect(rationale.length).toBeGreaterThan(0);
    expect(baseEnemy.hp).toBe(50);
  });
});

describe('adjustHabitReward (ValueAdjuster parity)', () => {
  it('base reward is 10 AP with no skips or streak', () => {
    expect(adjustHabitReward(mkHabit()).adjustedAP).toBe(10);
  });

  it('adds 20% per skip', () => {
    expect(adjustHabitReward(mkHabit({ skipCount: 2 })).adjustedAP).toBe(14);
  });

  it('lowers difficulty after 3+ skips', () => {
    const r = adjustHabitReward(mkHabit({ skipCount: 3, difficulty: 3 }));
    expect(r.newDifficulty).toBe(2);
    expect(r.adjustedAP).toBe(16);
  });

  it('raises difficulty and adds 10% on a 5+ day streak', () => {
    const r = adjustHabitReward(mkHabit({ streak: 5, difficulty: 3 }));
    expect(r.newDifficulty).toBe(4);
    expect(r.adjustedAP).toBe(11);
  });

  it('difficulty stays within 1..10', () => {
    expect(adjustHabitReward(mkHabit({ skipCount: 3, difficulty: 1 })).newDifficulty).toBe(1);
    expect(adjustHabitReward(mkHabit({ streak: 5, difficulty: 10 })).newDifficulty).toBe(10);
  });
});
