import { describe, it, expect } from 'vitest';
import {
  BESTIARY,
  pickEnemy,
  chooseTarget,
  recordBattleMemory,
  analyzeMemory,
  applyCounters,
  type BattleMemory,
  type BattleRecord,
} from './enemyAI';
import type { PartyMember, InventoryItem } from '../types/schemas';

const mkMember = (over: Partial<PartyMember> = {}): PartyMember => ({
  id: 'p1', name: 'Althea', avatar: '', role: 'Leader',
  level: 1, hp: 100, maxHp: 100, mp: 20, maxMp: 20, attack: 12, defense: 5, equipment: {}, ...over,
});

const party: PartyMember[] = [
  mkMember({ id: 'p1', name: 'Althea', hp: 80, mp: 20 }),
  mkMember({ id: 'p2', name: 'Kael', hp: 30, mp: 10 }),
  mkMember({ id: 'p3', name: 'Elora', hp: 70, mp: 50 }),
];

const armorOn = (memberId: string): InventoryItem => ({
  id: `armor-${memberId}`, templateId: 'leather', name: 'Leather Vest', type: 'Equipment',
  icon: 'shield', description: '', weight: 2, quantity: 1,
  statBonus: { defense: 5 }, equippedTo: memberId,
});

const mkRecord = (over: Partial<BattleRecord> = {}): BattleRecord => ({
  won: true, strikes: 4, potionsUsed: 0, distinctStrikers: 3, ...over,
});

const emptyMemory: BattleMemory = { records: [] };

describe('BESTIARY', () => {
  it('has at least 3 enemies with unique names and every archetype represented', () => {
    expect(BESTIARY.length).toBeGreaterThanOrEqual(3);
    const names = new Set(BESTIARY.map(e => e.name));
    expect(names.size).toBe(BESTIARY.length);
    const archetypes = new Set(BESTIARY.map(e => e.archetype));
    expect(archetypes).toEqual(new Set(['Aggressor', 'Tactician', 'Opportunist']));
  });
});

describe('pickEnemy', () => {
  it('is deterministic for identical inputs', () => {
    const a = pickEnemy({ progress: 10, battlesFought: 2 });
    const b = pickEnemy({ progress: 10, battlesFought: 2 });
    expect(a.name).toBe(b.name);
  });

  it('rotates through the pool as battles accumulate', () => {
    const seen = new Set(
      [0, 1, 2, 3, 4].map(n => pickEnemy({ progress: 10, battlesFought: n }).name)
    );
    expect(seen.size).toBeGreaterThan(1);
  });

  it('offers stronger enemies at higher campaign progress', () => {
    const early = pickEnemy({ progress: 0, battlesFought: 0 });
    const late = pickEnemy({ progress: 90, battlesFought: 0 });
    expect(late.hp).toBeGreaterThan(early.hp);
  });

  it('returns a fresh copy each call', () => {
    const a = pickEnemy({ progress: 0, battlesFought: 0 });
    a.hp = 1;
    const b = pickEnemy({ progress: 0, battlesFought: 0 });
    expect(b.hp).toBeGreaterThan(1);
  });
});

describe('chooseTarget', () => {
  it('Aggressor picks the lowest-HP living member', () => {
    expect(chooseTarget('Aggressor', party, [])?.id).toBe('p2');
  });

  it('Tactician picks the highest-MP living member', () => {
    expect(chooseTarget('Tactician', party, [])?.id).toBe('p3');
  });

  it('Opportunist picks an unarmored member', () => {
    const inv = [armorOn('p2'), armorOn('p3')];
    expect(chooseTarget('Opportunist', party, inv)?.id).toBe('p1');
  });

  it('Opportunist falls back to lowest HP when everyone is armored', () => {
    const inv = [armorOn('p1'), armorOn('p2'), armorOn('p3')];
    expect(chooseTarget('Opportunist', party, inv)?.id).toBe('p2');
  });

  it('never targets a downed member and returns null for a wiped party', () => {
    const wounded = party.map(m => (m.id === 'p2' ? { ...m, hp: 0 } : m));
    expect(chooseTarget('Aggressor', wounded, [])?.id).not.toBe('p2');
    const wiped = party.map(m => ({ ...m, hp: 0 }));
    expect(chooseTarget('Aggressor', wiped, [])).toBeNull();
  });
});

describe('battle memory', () => {
  it('keeps only the last 5 records', () => {
    let mem = emptyMemory;
    for (let i = 0; i < 7; i++) {
      mem = recordBattleMemory(mem, mkRecord({ strikes: i }));
    }
    expect(mem.records.length).toBe(5);
    expect(mem.records[4].strikes).toBe(6); // newest kept
    expect(mem.records[0].strikes).toBe(2); // oldest two dropped
  });

  it('flags potion spam after 3+ battles averaging 2+ potions', () => {
    let mem = emptyMemory;
    for (let i = 0; i < 3; i++) mem = recordBattleMemory(mem, mkRecord({ potionsUsed: 3 }));
    expect(analyzeMemory(mem).potionSpam).toBe(true);
  });

  it('flags single-striker reliance after 3+ battles with one striker', () => {
    let mem = emptyMemory;
    for (let i = 0; i < 3; i++) mem = recordBattleMemory(mem, mkRecord({ distinctStrikers: 1 }));
    expect(analyzeMemory(mem).singleStriker).toBe(true);
  });

  it('raises no flags with fewer than 3 battles', () => {
    let mem = recordBattleMemory(emptyMemory, mkRecord({ potionsUsed: 5, distinctStrikers: 1 }));
    const a = analyzeMemory(mem);
    expect(a.potionSpam).toBe(false);
    expect(a.singleStriker).toBe(false);
  });
});

describe('applyCounters', () => {
  const enemy = { id: 'e', name: 'Debt Gnome', hp: 50, maxHp: 50, attack: 10, defense: 2 };

  it('boosts attack against potion spam with rationale', () => {
    const r = applyCounters(enemy, { potionSpam: true, singleStriker: false });
    expect(r.enemy.attack).toBeGreaterThan(enemy.attack);
    expect(r.rationale.toLowerCase()).toContain('potion');
  });

  it('boosts defense against single-striker reliance', () => {
    const r = applyCounters(enemy, { potionSpam: false, singleStriker: true });
    expect(r.enemy.defense).toBeGreaterThan(enemy.defense);
    expect(r.rationale.toLowerCase()).toContain('striker');
  });

  it('leaves the enemy untouched with no flags', () => {
    const r = applyCounters(enemy, { potionSpam: false, singleStriker: false });
    expect(r.enemy).toEqual(enemy);
  });
});
