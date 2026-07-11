import { describe, it, expect } from 'vitest';
import { strikeDamage, counterDamage } from './combat';

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
