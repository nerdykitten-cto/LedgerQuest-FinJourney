import { describe, it, expect } from 'vitest';
import { bossObjective, nonBossObjectivesComplete, resolveBoss } from './chronicle';
import type { Quest } from '../types/schemas';

const quest = (objs: Array<{ type: 'talk' | 'kill' | 'travel'; target: string; isCompleted: boolean }>): Quest => ({
  id: 'q', title: 'T', description: '', type: 'main', difficulty: 1,
  reward: { exp: 100, gold: 50 }, status: 'active',
  objectives: objs.map((o, i) => ({ id: 'o' + i, text: '', ...o })),
});

describe('bossObjective', () => {
  it('returns the kill objective, or null when there is none', () => {
    expect(bossObjective(quest([{ type: 'talk', target: 'Daniel', isCompleted: true }, { type: 'kill', target: 'Gorgos', isCompleted: false }]))!.target).toBe('Gorgos');
    expect(bossObjective(quest([{ type: 'talk', target: 'Daniel', isCompleted: true }]))).toBeNull();
  });
});

describe('nonBossObjectivesComplete (invasion trigger)', () => {
  it('true when every non-kill objective is done and the kill is still pending', () => {
    expect(nonBossObjectivesComplete(quest([
      { type: 'talk', target: 'Daniel', isCompleted: true },
      { type: 'kill', target: 'Debt Gnomes', isCompleted: false },
    ]))).toBe(true);
  });
  it('false while a non-kill objective is still pending', () => {
    expect(nonBossObjectivesComplete(quest([
      { type: 'talk', target: 'Daniel', isCompleted: false },
      { type: 'kill', target: 'Debt Gnomes', isCompleted: false },
    ]))).toBe(false);
  });
  it('false once the boss is already dead (no re-trigger)', () => {
    expect(nonBossObjectivesComplete(quest([
      { type: 'talk', target: 'Daniel', isCompleted: true },
      { type: 'kill', target: 'Debt Gnomes', isCompleted: true },
    ]))).toBe(false);
  });
  it('false when the quest has no kill objective at all', () => {
    expect(nonBossObjectivesComplete(quest([{ type: 'talk', target: 'Daniel', isCompleted: true }]))).toBe(false);
  });
});

describe('resolveBoss', () => {
  it('beefs a bestiary boss above its base stats', () => {
    const b = resolveBoss('Debt Gnomes', 0);
    expect(b.name).toBe('Debt Gnomes');
    expect(b.hp).toBe(80);      // 50 * 1.6
    expect(b.maxHp).toBe(80);
    expect(b.attack).toBe(10);  // 8 * 1.25
    expect(b.defense).toBe(4);  // 2 + 2
  });
  it('synthesizes a boss absent from the bestiary (Gorgos)', () => {
    const b = resolveBoss('Gorgos', 0);
    expect(b.name).toBe('Gorgos');
    expect(b.hp).toBeGreaterThan(0);
    expect(b.attack).toBeGreaterThan(0);
  });
  it('scales up with world progress', () => {
    expect(resolveBoss('Debt Gnomes', 100).hp).toBeGreaterThan(resolveBoss('Debt Gnomes', 0).hp);
  });
});
