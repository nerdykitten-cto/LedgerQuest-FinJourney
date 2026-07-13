import { describe, it, expect } from 'vitest';
import { strikeDamage, counterDamage, ensureCombatStats } from './combat';

describe('strikeDamage', () => {
  it('sums attack + weapon - enemyDefense + roll, floored at 1', () => {
    expect(strikeDamage({ attack: 12, weaponAttack: 5, enemyDefense: 4, roll: 0, crit: false })).toBe(13);
  });
  it('applies a 1.5x crit multiplier (rounded)', () => {
    expect(strikeDamage({ attack: 12, weaponAttack: 5, enemyDefense: 4, roll: 0, crit: true })).toBe(20); // round(13*1.5)
  });
  it('never drops below 1', () => {
    expect(strikeDamage({ attack: 1, weaponAttack: 0, enemyDefense: 100, roll: 0, crit: false })).toBe(1);
  });
  it('higher enemy defense lowers damage (defense is live)', () => {
    const low = strikeDamage({ attack: 20, weaponAttack: 0, enemyDefense: 2, roll: 0, crit: false });
    const high = strikeDamage({ attack: 20, weaponAttack: 0, enemyDefense: 10, roll: 0, crit: false });
    expect(high).toBeLessThan(low);
  });
});

describe('counterDamage', () => {
  it('is enemyAttack - defense + roll, floored at 1', () => {
    expect(counterDamage({ enemyAttack: 12, defense: 5, roll: 0 })).toBe(7);
  });
  it('higher total defense lowers damage', () => {
    const low = counterDamage({ enemyAttack: 12, defense: 3, roll: 0 });
    const high = counterDamage({ enemyAttack: 12, defense: 20, roll: 0 });
    expect(high).toBeLessThan(low);
    expect(high).toBe(1);
  });
});

describe('NaN safety (anti-softlock)', () => {
  it('strikeDamage returns >=1 even if an input is NaN/undefined', () => {
    // A legacy party member with no base attack would make member.attack undefined.
    expect(strikeDamage({ attack: NaN, weaponAttack: 0, enemyDefense: 4, roll: 3, crit: false })).toBe(1);
    expect(Number.isFinite(strikeDamage({ attack: NaN, weaponAttack: 2, enemyDefense: 1, roll: 0, crit: true }))).toBe(true);
  });
  it('counterDamage returns >=1 even if an input is NaN/undefined', () => {
    expect(counterDamage({ enemyAttack: 8, defense: NaN, roll: 2 })).toBe(1);
    expect(Number.isFinite(counterDamage({ enemyAttack: NaN, defense: 3, roll: 1 }))).toBe(true);
  });
});

describe('ensureCombatStats (legacy-save migration)', () => {
  const base: any = { id: 'p1', name: 'X', avatar: '', role: 'Leader', hp: 100, maxHp: 100, mp: 0, maxMp: 0, level: 1, equipment: {} };
  it('fills missing base attack/defense from level', () => {
    const m = ensureCombatStats({ ...base, level: 1 });
    expect(m.attack).toBe(10);
    expect(m.defense).toBe(5);
  });
  it('scales the fallback by level', () => {
    const m = ensureCombatStats({ ...base, level: 3 });
    expect(m.attack).toBe(14); // 10 + 2*(3-1)
    expect(m.defense).toBe(7);  // 5 + 1*(3-1)
  });
  it('leaves existing stats untouched', () => {
    const m = ensureCombatStats({ ...base, level: 1, attack: 15, defense: 9 });
    expect(m.attack).toBe(15);
    expect(m.defense).toBe(9);
  });
});
