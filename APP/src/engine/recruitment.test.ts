import { describe, it, expect } from 'vitest';
import { evaluateRecruit, evaluateDismiss, recruitCost, FRONT_ROLES } from './recruitment';
import type { PartyMember } from '../types/schemas';

const mkMember = (over: Partial<PartyMember> = {}): PartyMember => ({
  id: 'p1', name: 'Althea', avatar: '', role: 'Leader',
  level: 1, hp: 100, maxHp: 100, mp: 20, maxMp: 20, equipment: {}, ...over,
});

/** Mirrors the seeded party: Leader + Vanguard front, three support roles. */
const seedParty = (): PartyMember[] => [
  mkMember(),
  mkMember({ id: 'p2', name: 'Kael', role: 'Vanguard', hp: 120, maxHp: 120 }),
  mkMember({ id: 'p3', name: 'Elora', role: 'Arcanist', hp: 80, maxHp: 80, mp: 50, maxMp: 50 }),
  mkMember({ id: 'p4', name: 'Thal', role: 'Sharpshooter', hp: 90, maxHp: 90 }),
  mkMember({ id: 'p5', name: 'Lia', role: 'Lightweaver', hp: 70, maxHp: 70, mp: 40, maxMp: 40 }),
];

describe('recruitCost', () => {
  it('starts at 100 gold and grows 20 per member beyond the leader', () => {
    expect(recruitCost([mkMember()])).toBe(100);
    expect(recruitCost(seedParty())).toBe(180);
  });
});

describe('evaluateRecruit', () => {
  const base = { party: seedParty().slice(0, 4), gold: 500, worldState: 'town' as const };

  it('denies recruiting outside a settlement', () => {
    const res = evaluateRecruit({ ...base, worldState: 'peace', slot: 'support' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason.toLowerCase()).toContain('city');
  });

  it('denies when the slot row is already full', () => {
    // front capacity is 3; fill it (Leader + two Vanguards) so the row is full
    const fullFront = [
      mkMember(),
      mkMember({ id: 'p2', name: 'Kael', role: 'Vanguard' }),
      mkMember({ id: 'p6', name: 'Gorm', role: 'Vanguard' }),
    ];
    const res = evaluateRecruit({ party: fullFront, gold: 500, worldState: 'town', slot: 'front' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason.toLowerCase()).toContain('full');
  });

  it('denies when gold cannot cover the signing cost', () => {
    const res = evaluateRecruit({ ...base, gold: 10, slot: 'support' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain(`${recruitCost(base.party)}`);
  });

  it('recruits a front-line candidate with a role that belongs in the front row', () => {
    const party = seedParty().filter(m => m.role !== 'Vanguard'); // free front slot
    const res = evaluateRecruit({ party, gold: 500, worldState: 'town', slot: 'front' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(FRONT_ROLES).toContain(res.member.role);
      expect(res.member.hp).toBe(res.member.maxHp);
      expect(res.cost).toBe(recruitCost(party));
      expect(party.some(m => m.name === res.member.name)).toBe(false);
      expect(res.member.id).toBeTruthy();
    }
  });

  it('scales candidate stats to the average party level', () => {
    const party = [mkMember({ level: 3 }), mkMember({ id: 'p2', name: 'Kael', role: 'Vanguard', level: 3 })];
    const res = evaluateRecruit({ party, gold: 500, worldState: 'town', slot: 'support' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.member.level).toBe(3);
      // +10 maxHp per level above 1, mirroring rewardEngine level-ups
      const lowLevel = evaluateRecruit({ party: [mkMember(), mkMember({ id: 'p2', name: 'Kael', role: 'Vanguard' })], gold: 500, worldState: 'town', slot: 'support' });
      if (lowLevel.ok) expect(res.member.maxHp).toBe(lowLevel.member.maxHp + 20);
    }
  });

  it('skips candidates whose name is already in the party', () => {
    const party = seedParty().slice(0, 4);
    const first = evaluateRecruit({ party, gold: 500, worldState: 'town', slot: 'support' });
    expect(first.ok).toBe(true);
    if (first.ok) {
      const withFirst = [...party.slice(0, 3), first.member]; // still one support slot free
      const second = evaluateRecruit({ party: withFirst, gold: 500, worldState: 'town', slot: 'support' });
      expect(second.ok).toBe(true);
      if (second.ok) expect(second.member.name).not.toBe(first.member.name);
    }
  });

  it('denies when the candidate pool for the slot is exhausted', () => {
    const party = seedParty().slice(0, 2);
    let current = party;
    // drain the support pool: capacity 3, pool 3
    for (let i = 0; i < 3; i++) {
      const res = evaluateRecruit({ party: current, gold: 5000, worldState: 'town', slot: 'support' });
      expect(res.ok).toBe(true);
      if (res.ok) current = [...current, res.member];
    }
    // all support names taken; free a slot but keep the names
    const drained = current.map((m, i) => (i === current.length - 1 ? { ...m, role: 'Vanguard' } : m));
    const res = evaluateRecruit({ party: drained, gold: 5000, worldState: 'town', slot: 'support' });
    // support row now has 2 members but every pool name is in the party
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason.toLowerCase()).toContain('no');
  });
});

describe('evaluateDismiss', () => {
  it('refuses to dismiss the party leader', () => {
    const res = evaluateDismiss(seedParty(), 'p1');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason.toLowerCase()).toContain('leader');
  });

  it('refuses unknown members', () => {
    expect(evaluateDismiss(seedParty(), 'nope').ok).toBe(false);
  });

  it('dismisses a regular member with a rationale naming them', () => {
    const res = evaluateDismiss(seedParty(), 'p4');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.rationale).toContain('Thal');
  });
});
