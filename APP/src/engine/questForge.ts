import type { Expense, Quest, CampaignState } from '../types/schemas';
import { BESTIARY, pickEnemy } from './enemyAI';
import { LOCATIONS, TOWN_NPCS, BOSSES } from './world';
import storyManifest from '../data/storyManifest.json';

export interface WorldModel {
  locations: string[];
  npcs: string[];
  enemies: string[];
}

export const DEFAULT_WORLD: WorldModel = {
  locations: LOCATIONS.map(l => l.name),
  npcs: Object.values(TOWN_NPCS).flat(),
  enemies: [...BESTIARY.map(e => e.name), ...BOSSES],
};

export interface ForgeContext {
  world: WorldModel;
  avgApPerDay: number;
  progress: number;
}

export function topSpendingCategory(expenses: Expense[]): string | null {
  if (expenses.length === 0) return null;
  const totals = new Map<string, number>();
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const difficultyForProgress = (progress: number): number => {
  if (progress >= 50) return 4;
  if (progress >= 25) return 3;
  return 2;
};

const maxApQuota = (avgApPerDay: number): number => Math.max(3, Math.floor(2 * avgApPerDay));

/** Reward bands per difficulty point; validateQuest enforces, forge stays inside. */
const EXP_PER_DIFFICULTY = 200;
const GOLD_PER_DIFFICULTY = 120;

export function forgeSideQuest(expenses: Expense[], ctx: ForgeContext): Quest | null {
  const category = topSpendingCategory(expenses);
  if (!category) return null;

  const difficulty = difficultyForProgress(ctx.progress);
  const enemy = pickEnemy({ progress: ctx.progress, battlesFought: 0 });

  return {
    id: `side-${slug(category)}`,
    title: `The ${category} Menace`,
    description: `Your ${category.toLowerCase()} spending has drawn something out of the dark. Track it down and put your ledger at ease.`,
    type: 'side',
    difficulty,
    reward: { exp: 80 * difficulty, gold: 50 * difficulty },
    status: 'available',
    requirements: {
      apQuota: Math.min(5 + difficulty, maxApQuota(ctx.avgApPerDay)),
      taskCount: 0,
      habitCount: 0,
    },
    objectives: [
      {
        id: `side-${slug(category)}-kill`,
        text: `Defeat the ${enemy.name} feeding on your ${category.toLowerCase()} spending`,
        type: 'kill',
        target: enemy.name,
        isCompleted: false,
      },
    ],
  };
}

export function validateQuest(
  quest: Quest,
  ctx: ForgeContext
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const obj of quest.objectives ?? []) {
    const known =
      obj.type === 'travel'
        ? ctx.world.locations
        : obj.type === 'talk'
          ? ctx.world.npcs
          : ctx.world.enemies;
    if (!known.includes(obj.target)) {
      errors.push(`Unknown ${obj.type} target "${obj.target}".`);
    }
  }

  if (quest.requirements && quest.requirements.apQuota > maxApQuota(ctx.avgApPerDay)) {
    errors.push(
      `AP quota ${quest.requirements.apQuota} exceeds ~2 days of earnings (max ${maxApQuota(ctx.avgApPerDay)}).`
    );
  }

  if (quest.reward.exp <= 0 || quest.reward.exp > EXP_PER_DIFFICULTY * quest.difficulty) {
    errors.push(`Exp reward ${quest.reward.exp} outside band for difficulty ${quest.difficulty}.`);
  }
  if (quest.reward.gold <= 0 || quest.reward.gold > GOLD_PER_DIFFICULTY * quest.difficulty) {
    errors.push(`Gold reward ${quest.reward.gold} outside band for difficulty ${quest.difficulty}.`);
  }

  return { valid: errors.length === 0, errors };
}

function repairQuest(quest: Quest, ctx: ForgeContext): Quest {
  const repaired: Quest = {
    ...quest,
    reward: {
      ...quest.reward,
      exp: Math.min(Math.max(1, quest.reward.exp), EXP_PER_DIFFICULTY * quest.difficulty),
      gold: Math.min(Math.max(1, quest.reward.gold), GOLD_PER_DIFFICULTY * quest.difficulty),
    },
    requirements: quest.requirements
      ? { ...quest.requirements, apQuota: Math.min(quest.requirements.apQuota, maxApQuota(ctx.avgApPerDay)) }
      : quest.requirements,
    objectives: quest.objectives?.map(o => {
      const known =
        o.type === 'travel' ? ctx.world.locations : o.type === 'talk' ? ctx.world.npcs : ctx.world.enemies;
      if (known.includes(o.target) || known.length === 0) return o;
      return { ...o, target: known[0], text: o.text.replace(o.target, known[0]) };
    }),
  };
  return repaired;
}

const MAX_FORGE_ATTEMPTS = 3;

export function forgeValidatedSideQuest(
  expenses: Expense[],
  ctx: ForgeContext,
  existingQuests: Quest[]
): { quest: Quest | null; attempts: number; log: string[] } {
  const log: string[] = [];
  let quest = forgeSideQuest(expenses, ctx);
  if (!quest) {
    return { quest: null, attempts: 0, log: ['No expenses to theme a quest from.'] };
  }

  const dup = existingQuests.find(q => q.id === quest!.id && q.status !== 'failed');
  if (dup) {
    log.push(`Duplicate: side quest "${quest.title}" already exists (${dup.status}).`);
    return { quest: null, attempts: 0, log };
  }

  for (let attempt = 1; attempt <= MAX_FORGE_ATTEMPTS; attempt++) {
    const res = validateQuest(quest, ctx);
    if (res.valid) {
      log.push(`Attempt ${attempt}: quest "${quest.title}" passed QC.`);
      return { quest, attempts: attempt, log };
    }
    log.push(`Attempt ${attempt}: rejected (${res.errors.join(' ')})`);
    quest = repairQuest(quest, ctx);
  }

  return { quest: null, attempts: MAX_FORGE_ATTEMPTS, log };
}

const isTownLocation = (location: string): boolean => {
  const l = location.toLowerCase();
  return ['town', 'village', 'city', 'citadel'].some(word => l.includes(word));
};

/** Manifest spine: surface the current chapter's main quest when the player is idle at a town. */
export function nextMainQuest(
  campaign: CampaignState,
  quests: Quest[]
): { quest: Quest | null; rationale: string } {
  if (!isTownLocation(campaign.currentLocation)) {
    return { quest: null, rationale: 'Player is in the wilds; main quests surface at towns.' };
  }
  if (quests.some(q => q.status === 'active' || q.status === 'available')) {
    return { quest: null, rationale: 'A quest is already live; waiting before offering more.' };
  }

  const chapter =
    [...storyManifest.chapters].reverse().find(ch => campaign.progressPercentage >= ch.minProgress) ??
    storyManifest.chapters[0];
  const mq = chapter.mainQuests[0];
  if (!mq) return { quest: null, rationale: `No main quest defined for ${chapter.title}.` };

  if (quests.some(q => q.id === mq.id && q.status === 'completed')) {
    return { quest: null, rationale: `All primary objectives for ${chapter.title} completed.` };
  }

  const quest = {
    ...mq,
    type: 'main',
    status: 'available',
    requirements: { apQuota: 5, taskCount: 0, habitCount: 0 },
  } as Quest;

  return { quest, rationale: `Nudging player to Main Quest: ${quest.title}` };
}
