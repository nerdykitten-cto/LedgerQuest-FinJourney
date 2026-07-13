/**
 * Pure combat damage math. RNG (roll) and crit decision are made by the caller
 * (CombatScene); these functions are deterministic and unit-tested.
 */

import type { PartyMember } from '../types/schemas';
import { ATTACK_PER_LEVEL, DEFENSE_PER_LEVEL } from './rewardEngine';

/** Fallback base stats for saves created before the combat-stats feature. */
const BASE_ATTACK = 10;
const BASE_DEFENSE = 5;

/**
 * Backfill a party member's base attack/defense when a legacy save is missing
 * them (schema requires the fields, but older persisted members predate them).
 * Without this the combat math produced NaN damage and softlocked the battle.
 */
export function ensureCombatStats(m: PartyMember): PartyMember {
  const level = Number.isFinite(m.level) ? m.level : 1;
  return {
    ...m,
    attack: Number.isFinite(m.attack) ? m.attack : BASE_ATTACK + ATTACK_PER_LEVEL * (level - 1),
    defense: Number.isFinite(m.defense) ? m.defense : BASE_DEFENSE + DEFENSE_PER_LEVEL * (level - 1),
  };
}

export interface StrikeInput {
  attack: number;       // striking member's base attack (already level-grown)
  weaponAttack: number; // equipped weapon's statBonus.attack (0 if none)
  enemyDefense: number; // defending enemy's defense stat (now live)
  roll: number;         // rand(0..9)
  crit: boolean;        // 10% chance decided by caller
}

/** Player strike damage. Enemy defense is subtracted; result floored at 1. */
export function strikeDamage(i: StrikeInput): number {
  const base = i.attack + i.weaponAttack - i.enemyDefense + i.roll;
  const dmg = i.crit ? Math.round(base * 1.5) : base;
  // Anti-softlock: a NaN (from a legacy member with no base attack) must never
  // reach the HP math, or enemy.hp becomes NaN and the battle can't be won.
  return Number.isFinite(dmg) ? Math.max(1, dmg) : 1;
}

export interface CounterInput {
  enemyAttack: number; // attacking enemy's attack stat
  defense: number;     // defending member's base defense + summed gear defense
  roll: number;        // rand(0..4)
}

/** Enemy counter damage. Total member defense is subtracted; floored at 1. */
export function counterDamage(i: CounterInput): number {
  const dmg = i.enemyAttack - i.defense + i.roll;
  return Number.isFinite(dmg) ? Math.max(1, dmg) : 1;
}
