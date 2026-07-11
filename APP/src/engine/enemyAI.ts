import type { Enemy, PartyMember, InventoryItem } from '../types/schemas';

export type Archetype = 'Aggressor' | 'Tactician' | 'Opportunist';

export interface BestiaryEnemy extends Enemy {
  archetype: Archetype;
  tier: number; // 1..3, gated by campaign progress
}

export const BESTIARY: BestiaryEnemy[] = [
  { id: 'debt-gnome', name: 'Debt Gnome', hp: 50, maxHp: 50, attack: 8, defense: 2, archetype: 'Aggressor', tier: 1 },
  { id: 'interest-imp', name: 'Interest Imp', hp: 40, maxHp: 40, attack: 9, defense: 1, archetype: 'Opportunist', tier: 1 },
  { id: 'ledger-wraith', name: 'Ledger Wraith', hp: 70, maxHp: 70, attack: 11, defense: 3, archetype: 'Tactician', tier: 2 },
  { id: 'overdraft-ogre', name: 'Overdraft Ogre', hp: 85, maxHp: 85, attack: 12, defense: 4, archetype: 'Aggressor', tier: 2 },
  { id: 'inflation-djinn', name: 'Inflation Djinn', hp: 110, maxHp: 110, attack: 15, defense: 5, archetype: 'Opportunist', tier: 3 },
  { id: 'compound-golem', name: 'Compound Golem', hp: 140, maxHp: 140, attack: 18, defense: 6, archetype: 'Tactician', tier: 3 },
];

const tierForProgress = (progress: number): number => {
  if (progress >= 50) return 3;
  if (progress >= 25) return 2;
  return 1;
};

/** Deterministic pick: current-tier pool, rotated by battles fought. */
export function pickEnemy(input: { progress: number; battlesFought: number }): BestiaryEnemy {
  const tier = tierForProgress(input.progress);
  const pool = BESTIARY.filter(e => e.tier === tier);
  const chosen = pool[input.battlesFought % pool.length];
  return { ...chosen };
}

export function chooseTarget(
  archetype: Archetype,
  party: PartyMember[],
  inventory: InventoryItem[]
): PartyMember | null {
  const alive = party.filter(m => m.hp > 0);
  if (alive.length === 0) return null;

  const byLowestHp = [...alive].sort((a, b) => a.hp - b.hp)[0];

  switch (archetype) {
    case 'Aggressor':
      return byLowestHp;
    case 'Tactician':
      return [...alive].sort((a, b) => b.mp - a.mp)[0];
    case 'Opportunist': {
      const armored = new Set(
        inventory
          .filter(i => i.type === 'Equipment' && i.statBonus?.defense !== undefined && i.equippedTo)
          .map(i => i.equippedTo as string)
      );
      const unarmored = alive.filter(m => !armored.has(m.id));
      return unarmored.length > 0 ? [...unarmored].sort((a, b) => a.hp - b.hp)[0] : byLowestHp;
    }
  }
}

export interface BattleRecord {
  won: boolean;
  strikes: number;
  potionsUsed: number;
  distinctStrikers: number;
}

export interface BattleMemory {
  records: BattleRecord[];
}

const MEMORY_SIZE = 5;

export const recordBattleMemory = (mem: BattleMemory, record: BattleRecord): BattleMemory => ({
  records: [...mem.records, record].slice(-MEMORY_SIZE),
});

export interface MemoryAnalysis {
  potionSpam: boolean;
  singleStriker: boolean;
}

/** Patterns only count once there is enough evidence (3+ remembered battles). */
export function analyzeMemory(mem: BattleMemory): MemoryAnalysis {
  const n = mem.records.length;
  if (n < 3) return { potionSpam: false, singleStriker: false };

  const avgPotions = mem.records.reduce((s, r) => s + r.potionsUsed, 0) / n;
  const avgStrikers = mem.records.reduce((s, r) => s + r.distinctStrikers, 0) / n;

  return {
    potionSpam: avgPotions >= 2,
    singleStriker: avgStrikers <= 1.2,
  };
}

export function applyCounters(
  enemy: Enemy,
  analysis: MemoryAnalysis
): { enemy: Enemy; rationale: string } {
  let attack = enemy.attack;
  let defense = enemy.defense;
  const reasons: string[] = [];

  if (analysis.potionSpam) {
    attack = Math.round(attack * 1.2);
    reasons.push('Counter: player leans on potions, attack raised 20% to outpace healing.');
  }
  if (analysis.singleStriker) {
    defense = defense + 2;
    reasons.push('Counter: single-striker pattern detected, defense raised to punish predictability.');
  }

  if (reasons.length === 0) {
    return { enemy, rationale: 'No exploitable pattern in recent battles.' };
  }
  return { enemy: { ...enemy, attack, defense }, rationale: reasons.join(' ') };
}
