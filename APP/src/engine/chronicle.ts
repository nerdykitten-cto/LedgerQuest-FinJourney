import type { Enemy, Quest } from '../types/schemas';
import { BESTIARY } from './enemyAI';

/**
 * Chronicle boss invasion logic (item 4). Pure + deterministic so it is testable without
 * React/localStorage. A chronicle = a main-quest chapter whose objectives are non-boss
 * (talk/travel) + a final `kill` (the boss). Finishing the non-boss objectives triggers the
 * invasion; the kill is satisfied only by beating the invading boss.
 */

type Objective = NonNullable<Quest['objectives']>[number];

/** The final boss (kill) objective of a chronicle quest, or null if it has none. */
export const bossObjective = (quest: Quest): Objective | null =>
  quest.objectives?.find(o => o.type === 'kill') ?? null;

/** Invasion trigger: every non-kill objective done AND the kill objective still pending. */
export const nonBossObjectivesComplete = (quest: Quest): boolean => {
  const objs = quest.objectives ?? [];
  const boss = objs.find(o => o.type === 'kill');
  if (!boss || boss.isCompleted) return false;
  return objs.filter(o => o.type !== 'kill').every(o => o.isCompleted);
};

// Manifest kill target -> bestiary id (bosses that exist in the bestiary).
const BOSS_BESTIARY: Record<string, string> = {
  'Debt Gnomes': 'debt-gnome',
  'Inflation Djinn': 'inflation-djinn',
  'Compound Golem': 'compound-golem',
};

// Bosses referenced by the manifest but absent from the bestiary — synthesized bases.
const BOSS_SYNTH: Record<string, Enemy> = {
  Gorgos: { id: 'gorgos', name: 'Gorgos', hp: 90, maxHp: 90, attack: 13, defense: 4, archetype: 'Aggressor' },
};

const BOSS_HP_MULT = 1.6;
const BOSS_ATK_MULT = 1.25;

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Build the invading boss Enemy: a beefed bestiary/synth base scaled up by world progress. */
export const resolveBoss = (bossName: string, progress: number): Enemy => {
  const baseId = BOSS_BESTIARY[bossName];
  const base: Enemy =
    (baseId && BESTIARY.find(e => e.id === baseId)) ||
    BOSS_SYNTH[bossName] ||
    { id: 'boss-generic', name: bossName, hp: 80, maxHp: 80, attack: 12, defense: 4, archetype: 'Aggressor' };
  const prog = 1 + Math.max(0, Math.min(100, progress)) / 200; // up to +50% at 100% progress
  const hp = Math.round(base.hp * BOSS_HP_MULT * prog);
  const attack = Math.round(base.attack * BOSS_ATK_MULT * prog);
  const defense = base.defense + 2;
  return { id: 'boss-' + (baseId ?? slug(bossName)), name: bossName, hp, maxHp: hp, attack, defense, archetype: base.archetype };
};
