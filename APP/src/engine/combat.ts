/**
 * Pure combat damage math. RNG (roll) and crit decision are made by the caller
 * (CombatScene); these functions are deterministic and unit-tested.
 */

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
  return Math.max(1, dmg);
}

export interface CounterInput {
  enemyAttack: number; // attacking enemy's attack stat
  defense: number;     // defending member's base defense + summed gear defense
  roll: number;        // rand(0..4)
}

/** Enemy counter damage. Total member defense is subtracted; floored at 1. */
export function counterDamage(i: CounterInput): number {
  return Math.max(1, i.enemyAttack - i.defense + i.roll);
}
