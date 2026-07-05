import type { Enemy, Habit } from '../types/schemas';
import type { PlayerSignals } from './playerModel';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Target band for adaptive difficulty: keep the player winning 55-65% of battles.
export const WIN_RATE_TARGET_LOW = 0.55;
export const WIN_RATE_TARGET_HIGH = 0.65;

/**
 * Composite skill score in 0..1 from six signals:
 * combat win rate, habit + task completion, expense-log streak,
 * budget pace discipline, and potion reliance (penalty).
 */
export function skillScore(s: PlayerSignals): number {
  const streakComponent = Math.min(s.logStreak, 7) / 7;
  const budgetComponent = s.budgetPace <= 1 ? 1 : clamp(2 - s.budgetPace, 0, 1);
  const potionPenalty = Math.min(s.potionsPerBattle * 0.05, 0.1);

  const score =
    s.combatWinRate * 0.35 +
    s.habitCompletionRate * 0.2 +
    s.taskCompletionRate * 0.15 +
    streakComponent * 0.15 +
    budgetComponent * 0.15 -
    potionPenalty;

  return clamp(score, 0, 1);
}

export interface DifficultyDecision {
  multiplier: number;
  rationale: string;
}

export function difficultyMultiplier(s: PlayerSignals): DifficultyDecision {
  const score = skillScore(s);
  let multiplier = 0.7 + score * 0.6; // 0.7 .. 1.3 from skill alone
  const reasons: string[] = [`Skill score ${score.toFixed(2)} sets base ${multiplier.toFixed(2)}.`];

  if (s.combatWinRate > WIN_RATE_TARGET_HIGH) {
    multiplier += 0.1;
    reasons.push(`Win rate ${(s.combatWinRate * 100).toFixed(0)}% above 55-65% target band: +0.10.`);
  } else if (s.combatWinRate < WIN_RATE_TARGET_LOW) {
    multiplier -= 0.1;
    reasons.push(`Win rate ${(s.combatWinRate * 100).toFixed(0)}% below 55-65% target band: -0.10.`);
  }

  if (s.lossStreak >= 2) {
    const pity = 0.1 * (s.lossStreak - 1);
    multiplier -= pity;
    reasons.push(`Pity bonus for ${s.lossStreak} straight losses: -${pity.toFixed(2)}.`);
  }

  multiplier = clamp(multiplier, 0.5, 1.6);
  return { multiplier, rationale: reasons.join(' ') };
}

export function scaleEnemy(
  base: Enemy,
  s: PlayerSignals
): { enemy: Enemy; rationale: string } {
  const { multiplier, rationale } = difficultyMultiplier(s);
  const hp = Math.max(10, Math.round(base.hp * multiplier));
  const attack = Math.max(1, Math.round(base.attack * multiplier));
  return {
    enemy: { ...base, hp, maxHp: hp, attack },
    rationale: `${base.name} scaled x${multiplier.toFixed(2)} (HP ${base.hp}->${hp}, ATK ${base.attack}->${attack}). ${rationale}`,
  };
}

/**
 * Habit AP reward. Rules carried over verbatim from the legacy ValueAdjuster:
 * base 10 AP, +20% per skip, difficulty -1 after 3+ skips, difficulty +1 and
 * +10% on a 5+ day streak, difficulty clamped 1..10.
 */
export function adjustHabitReward(habit: Habit): {
  adjustedAP: number;
  newDifficulty: number;
  rationale: string;
} {
  let multiplier = 1.0;
  let newDifficulty = habit.difficulty;
  let rationale = '';

  if (habit.skipCount > 0) {
    multiplier += habit.skipCount * 0.2;
    rationale = `Incentive: Reward increased by ${habit.skipCount * 20}% due to skips. `;
  }

  if (habit.skipCount >= 3) {
    newDifficulty = Math.max(1, habit.difficulty - 1);
    rationale += 'Momentum: Difficulty lowered to help you restart. ';
  }

  if (habit.streak >= 5) {
    newDifficulty = Math.min(10, habit.difficulty + 1);
    multiplier += 0.1;
    rationale += `Challenge: Difficulty increased for your ${habit.streak}-day streak! `;
  }

  const baseReward = 10;
  return { adjustedAP: Math.round(baseReward * multiplier), newDifficulty, rationale };
}
