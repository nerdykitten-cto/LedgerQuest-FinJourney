/**
 * Party recruitment rules. Recruits are only found in settlements (the player
 * must be inside a town/city scene), cost gold that scales with party size,
 * and come from a fixed candidate pool so decisions stay deterministic.
 */

import type { CampaignState, PartyMember } from '../types/schemas';
import { ATTACK_PER_LEVEL, DEFENSE_PER_LEVEL } from './rewardEngine';

export type RecruitSlot = 'front' | 'support';

/** Roles rendered in the WarRoom front row. */
export const FRONT_ROLES = ['Leader', 'Vanguard'];

export const FRONT_CAPACITY = 3;
export const SUPPORT_CAPACITY = 3;

interface Candidate {
  name: string;
  role: string;
  avatar: string;
  baseHp: number;
  baseMp: number;
  baseAttack: number;
  baseDefense: number;
}

const FRONT_POOL: Candidate[] = [
  { name: 'Bram', role: 'Vanguard', avatar: '/assets/game/characters/bram.png', baseHp: 120, baseMp: 10, baseAttack: 15, baseDefense: 5 },
  { name: 'Sigrid', role: 'Vanguard', avatar: '/assets/game/characters/sigrid.png', baseHp: 130, baseMp: 8, baseAttack: 15, baseDefense: 5 },
];

const SUPPORT_POOL: Candidate[] = [
  { name: 'Mirelle', role: 'Arcanist', avatar: '/assets/game/characters/mirelle.png', baseHp: 80, baseMp: 50, baseAttack: 10, baseDefense: 3 },
  { name: 'Fenwick', role: 'Sharpshooter', avatar: '/assets/game/characters/fenwick.png', baseHp: 90, baseMp: 15, baseAttack: 14, baseDefense: 3 },
  { name: 'Isolde', role: 'Lightweaver', avatar: '/assets/game/characters/isolde.png', baseHp: 70, baseMp: 40, baseAttack: 9, baseDefense: 3 },
];

export const isFrontRole = (role: string): boolean => FRONT_ROLES.includes(role);

export function recruitCost(party: PartyMember[]): number {
  return 100 + 20 * Math.max(0, party.length - 1);
}

export interface RecruitRequest {
  party: PartyMember[];
  gold: number;
  worldState: CampaignState['worldState'];
  slot: RecruitSlot;
}

export type RecruitDecision =
  | { ok: true; member: PartyMember; cost: number; rationale: string }
  | { ok: false; reason: string };

export function evaluateRecruit(req: RecruitRequest): RecruitDecision {
  const { party, gold, worldState, slot } = req;

  if (worldState !== 'town') {
    return { ok: false, reason: 'Recruits gather in settlements — visit a city first.' };
  }

  const inSlot = party.filter(m => (slot === 'front' ? isFrontRole(m.role) : !isFrontRole(m.role)));
  const capacity = slot === 'front' ? FRONT_CAPACITY : SUPPORT_CAPACITY;
  if (inSlot.length >= capacity) {
    return { ok: false, reason: 'That row of the formation is full — dismiss someone first.' };
  }

  const cost = recruitCost(party);
  if (gold < cost) {
    return { ok: false, reason: `Signing a recruit costs ${cost} gold — you carry ${gold}.` };
  }

  const pool = slot === 'front' ? FRONT_POOL : SUPPORT_POOL;
  const taken = new Set(party.map(m => m.name));
  const candidate = pool.find(c => !taken.has(c.name));
  if (!candidate) {
    return { ok: false, reason: 'No recruits of that kind remain in this region.' };
  }

  // Recruits arrive at the party's average level; +10 maxHp per level above 1
  // mirrors the rewardEngine level-up curve.
  const level = Math.max(1, Math.round(party.reduce((s, m) => s + m.level, 0) / party.length));
  const maxHp = candidate.baseHp + 10 * (level - 1);
  const member: PartyMember = {
    id: `recruit-${candidate.name.toLowerCase()}`,
    name: candidate.name,
    avatar: candidate.avatar,
    role: candidate.role,
    level,
    hp: maxHp,
    maxHp,
    mp: candidate.baseMp,
    maxMp: candidate.baseMp,
    attack: candidate.baseAttack + ATTACK_PER_LEVEL * (level - 1),
    defense: candidate.baseDefense + DEFENSE_PER_LEVEL * (level - 1),
    equipment: {},
  };

  return {
    ok: true,
    member,
    cost,
    rationale: `${candidate.name} (${candidate.role}, LV.${level}) signs on for ${cost} gold.`,
  };
}

export type DismissDecision =
  | { ok: true; rationale: string }
  | { ok: false; reason: string };

export function evaluateDismiss(party: PartyMember[], memberId: string): DismissDecision {
  const member = party.find(m => m.id === memberId);
  if (!member) return { ok: false, reason: 'That adventurer is not in the party.' };
  if (member.role === 'Leader') return { ok: false, reason: 'The party leader cannot be dismissed.' };
  return { ok: true, rationale: `${member.name} (${member.role}) leaves the formation.` };
}
