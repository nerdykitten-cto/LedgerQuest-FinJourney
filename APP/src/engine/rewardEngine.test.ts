import { describe, it, expect } from 'vitest';
import {
  expToNext,
  applyExp,
  battlePerformance,
  battleReward,
  applyLevelUps,
  taskReward,
  applyWinRecovery,
  applyDefeatRecovery,
} from './rewardEngine';
import type { PlayerStats, PartyMember } from '../types/schemas';

const mkStats = (over: Partial<PlayerStats> = {}): PlayerStats => ({
  level: 1, exp: 0, ap: 10, gold: 0, monthlyBudget: 3000, ...over,
});

const mkMember = (over: Partial<PartyMember> = {}): PartyMember => ({
  id: 'p1', name: 'Althea', avatar: '', role: 'Leader',
  level: 1, hp: 60, maxHp: 100, mp: 20, maxMp: 20, attack: 12, defense: 5, equipment: {}, ...over,
});

describe('expToNext', () => {
  it('follows 100 x level^1.5', () => {
    expect(expToNext(1)).toBe(100);
    expect(expToNext(2)).toBe(283);
    expect(expToNext(4)).toBe(800);
  });
});

describe('applyExp', () => {
  it('accumulates exp without leveling below the threshold', () => {
    const r = applyExp(mkStats(), 60);
    expect(r.stats.level).toBe(1);
    expect(r.stats.exp).toBe(60);
    expect(r.levelsGained).toBe(0);
  });

  it('levels up at the threshold and carries the remainder', () => {
    const r = applyExp(mkStats(), 150);
    expect(r.stats.level).toBe(2);
    expect(r.stats.exp).toBe(50);
    expect(r.levelsGained).toBe(1);
  });

  it('handles multiple level-ups in one grant', () => {
    const r = applyExp(mkStats(), 500);
    // 500 - 100 (lvl1->2) = 400; 400 - 283 (lvl2->3) = 117 < expToNext(3)=520
    expect(r.stats.level).toBe(3);
    expect(r.stats.exp).toBe(117);
    expect(r.levelsGained).toBe(2);
  });

  it('does not mutate input stats and reports rationale on level-up', () => {
    const s = mkStats();
    const r = applyExp(s, 150);
    expect(s.level).toBe(1);
    expect(r.rationale.toLowerCase()).toContain('level');
  });
});

describe('battlePerformance', () => {
  it('rewards fast, potion-free wins above sloppy ones', () => {
    const clean = battlePerformance({ strikes: 3, potionsUsed: 0 });
    const sloppy = battlePerformance({ strikes: 10, potionsUsed: 3 });
    expect(clean).toBeGreaterThan(sloppy);
  });

  it('clamps to [0.7, 1.3]', () => {
    expect(battlePerformance({ strikes: 1, potionsUsed: 0 })).toBeLessThanOrEqual(1.3);
    expect(battlePerformance({ strikes: 30, potionsUsed: 10 })).toBeGreaterThanOrEqual(0.7);
  });
});

describe('battleReward', () => {
  it('multiplies base by difficulty and performance', () => {
    const r = battleReward({ exp: 100, gold: 50 }, 1.2, 1.0);
    expect(r.exp).toBe(120);
    expect(r.gold).toBe(60);
  });

  it('rounds to integers and explains itself', () => {
    const r = battleReward({ exp: 100, gold: 50 }, 1.15, 1.1);
    expect(Number.isInteger(r.exp)).toBe(true);
    expect(Number.isInteger(r.gold)).toBe(true);
    expect(r.rationale).toContain('1.15');
  });
});

describe('taskReward (APEvaluator parity)', () => {
  it('pays base AP for optional tasks and 1.5x for necessities', () => {
    const base = { id: 't', title: '', description: '', isNecessity: false, baseAPReward: 10, isCompleted: false };
    expect(taskReward(base)).toBe(10);
    expect(taskReward({ ...base, isNecessity: true })).toBe(15);
  });

  it('rounds to whole AP', () => {
    const odd = { id: 't', title: '', description: '', isNecessity: true, baseAPReward: 5, isCompleted: false };
    expect(taskReward(odd)).toBe(8); // 5 * 1.5 = 7.5 -> 8
  });
});

describe('applyLevelUps', () => {
  it('raises party level and maxHp, heals to full', () => {
    const party = [mkMember()];
    const updated = applyLevelUps(party, 2);
    expect(updated[0].level).toBe(3);
    expect(updated[0].maxHp).toBe(120);
    expect(updated[0].hp).toBe(120);
    expect(updated[0].attack).toBe(16); // 12 + 2*2
    expect(updated[0].defense).toBe(7); // 5 + 1*2
  });

  it('returns party unchanged for zero levels', () => {
    const party = [mkMember()];
    expect(applyLevelUps(party, 0)).toEqual(party);
  });
});

describe('applyWinRecovery', () => {
  it('heals survivors by ceil(maxHp*0.3), capped, leaves fallen down', () => {
    const party = [mkMember({ id: 'a', hp: 10, maxHp: 100 }), mkMember({ id: 'b', hp: 0, maxHp: 80 })];
    const out = applyWinRecovery(party);
    expect(out[0].hp).toBe(40); // 10 + ceil(100*0.3)
    expect(out[1].hp).toBe(0);  // fallen stays down
  });
  it('does not exceed maxHp', () => {
    const out = applyWinRecovery([mkMember({ hp: 95, maxHp: 100 })]);
    expect(out[0].hp).toBe(100);
  });
});

describe('applyDefeatRecovery', () => {
  it('revives exactly one member (highest maxHp) to ceil(maxHp*0.3)', () => {
    const party = [mkMember({ id: 'a', hp: 0, maxHp: 80 }), mkMember({ id: 'b', hp: 0, maxHp: 120 })];
    const out = applyDefeatRecovery(party);
    expect(out.find(m => m.id === 'b')!.hp).toBe(36); // ceil(120*0.3)
    expect(out.find(m => m.id === 'a')!.hp).toBe(0);
  });
  it('breaks maxHp ties by array order (first)', () => {
    const party = [mkMember({ id: 'a', hp: 0, maxHp: 100 }), mkMember({ id: 'b', hp: 0, maxHp: 100 })];
    const out = applyDefeatRecovery(party);
    expect(out[0].hp).toBe(30);
    expect(out[1].hp).toBe(0);
  });
  it('is safe on an empty party', () => {
    expect(applyDefeatRecovery([])).toEqual([]);
  });
});

