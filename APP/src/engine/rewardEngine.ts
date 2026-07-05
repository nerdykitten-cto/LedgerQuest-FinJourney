import type { PlayerStats, PartyMember, FinanceTask } from '../types/schemas';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Exp required to advance from `level` to `level + 1`. */
export const expToNext = (level: number): number => Math.round(100 * Math.pow(level, 1.5));

export function applyExp(
  stats: PlayerStats,
  gained: number
): { stats: PlayerStats; levelsGained: number; rationale: string } {
  let level = stats.level;
  let exp = stats.exp + gained;
  let levelsGained = 0;

  while (exp >= expToNext(level)) {
    exp -= expToNext(level);
    level++;
    levelsGained++;
  }

  const rationale =
    levelsGained > 0
      ? `Gained ${gained} exp: level ${stats.level} -> ${level} (${exp}/${expToNext(level)} toward next).`
      : `Gained ${gained} exp (${exp}/${expToNext(level)} toward level ${level + 1}).`;

  return { stats: { ...stats, level, exp }, levelsGained, rationale };
}

export interface BattleStats {
  strikes: number;
  potionsUsed: number;
}

/** Performance factor 0.7..1.3: fewer strikes and fewer potions = better. */
export function battlePerformance(b: BattleStats): number {
  let perf = 1.0;
  if (b.strikes <= 4) perf += 0.2;
  else if (b.strikes >= 8) perf -= 0.2;
  perf -= Math.min(b.potionsUsed * 0.05, 0.15);
  return clamp(perf, 0.7, 1.3);
}

export function battleReward(
  base: { exp: number; gold: number },
  difficultyMultiplier: number,
  performance: number
): { exp: number; gold: number; rationale: string } {
  const exp = Math.round(base.exp * difficultyMultiplier * performance);
  const gold = Math.round(base.gold * difficultyMultiplier * performance);
  return {
    exp,
    gold,
    rationale: `Reward = base(${base.exp}xp/${base.gold}g) x difficulty(${difficultyMultiplier.toFixed(2)}) x performance(${performance.toFixed(2)}) = ${exp}xp/${gold}g.`,
  };
}

/** Task AP reward. Rule carried over from the legacy APEvaluator: 1.5x for necessities. */
export const taskReward = (task: FinanceTask): number =>
  Math.round(task.baseAPReward * (task.isNecessity ? 1.5 : 1));

const MAX_HP_PER_LEVEL = 10;

/** Party stat gains when the player levels up: +level, +10 maxHp per level, full heal. */
export function applyLevelUps(party: PartyMember[], levelsGained: number): PartyMember[] {
  if (levelsGained <= 0) return party;
  return party.map(m => {
    const maxHp = m.maxHp + MAX_HP_PER_LEVEL * levelsGained;
    return { ...m, level: m.level + levelsGained, maxHp, hp: maxHp };
  });
}
