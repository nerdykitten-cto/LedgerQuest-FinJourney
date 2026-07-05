import { describe, it, expect } from 'vitest';
import {
  topSpendingCategory,
  forgeSideQuest,
  validateQuest,
  forgeValidatedSideQuest,
  nextMainQuest,
  DEFAULT_WORLD,
  type ForgeContext,
} from './questForge';
import { LOCATIONS } from './world';
import storyManifest from '../data/storyManifest.json';
import type { Expense, Quest, CampaignState } from '../types/schemas';

const mkExpense = (category: string, amount: number): Expense => ({
  id: `e-${category}-${amount}`, amount, category, description: '', timestamp: Date.now(),
});

const ctx: ForgeContext = { world: DEFAULT_WORLD, avgApPerDay: 10, progress: 10 };

const mkCampaign = (over: Partial<CampaignState> = {}): CampaignState => ({
  currentLocation: 'Starting Village', progressPercentage: 0, worldState: 'town', ...over,
});

describe('story manifest spine', () => {
  it('has one chapter per map town, minProgress ascending', () => {
    expect(storyManifest.chapters.length).toBe(LOCATIONS.length);
    const locations = storyManifest.chapters.map(c => c.location);
    expect(new Set(locations)).toEqual(new Set(LOCATIONS.map(l => l.name)));
    const mins = storyManifest.chapters.map(c => c.minProgress);
    expect([...mins].sort((a, b) => a - b)).toEqual(mins);
  });

  it('every main quest validates against the world (targets exist, rewards in band)', () => {
    for (const ch of storyManifest.chapters) {
      for (const mq of ch.mainQuests) {
        const quest = { ...mq, type: 'main', status: 'available' } as Quest;
        const res = validateQuest(quest, ctx);
        expect(res.errors, `${mq.id}: ${res.errors.join('; ')}`).toEqual([]);
      }
    }
  });
});

describe('topSpendingCategory', () => {
  it('returns the category with the highest total spend', () => {
    const expenses = [
      mkExpense('Food', 50),
      mkExpense('Transport', 80),
      mkExpense('Food', 60),
    ];
    expect(topSpendingCategory(expenses)).toBe('Food');
  });

  it('returns null with no expenses', () => {
    expect(topSpendingCategory([])).toBeNull();
  });
});

describe('forgeSideQuest', () => {
  const expenses = [mkExpense('Food', 200), mkExpense('Bills', 50)];

  it('themes the quest after the top spending category', () => {
    const q = forgeSideQuest(expenses, ctx);
    expect(q?.title).toBe('The Food Menace');
    expect(q?.type).toBe('side');
  });

  it('targets a kill objective on an enemy that exists in the world', () => {
    const q = forgeSideQuest(expenses, ctx);
    const kill = q?.objectives?.find(o => o.type === 'kill');
    expect(kill).toBeDefined();
    expect(ctx.world.enemies).toContain(kill!.target);
  });

  it('caps apQuota at ~2 days of average AP earnings', () => {
    const q = forgeSideQuest(expenses, { ...ctx, avgApPerDay: 3 });
    expect(q?.requirements?.apQuota).toBeLessThanOrEqual(6);
  });

  it('returns null with no expenses to theme from', () => {
    expect(forgeSideQuest([], ctx)).toBeNull();
  });
});

describe('validateQuest', () => {
  const valid = forgeSideQuest([mkExpense('Food', 100)], ctx)!;

  it('accepts a well-formed quest', () => {
    expect(validateQuest(valid, ctx).valid).toBe(true);
  });

  it('rejects unknown objective targets', () => {
    const bad: Quest = {
      ...valid,
      objectives: [{ id: 'o', text: '', type: 'travel', target: 'Atlantis', isCompleted: false }],
    };
    const res = validateQuest(bad, ctx);
    expect(res.valid).toBe(false);
    expect(res.errors.join(' ')).toContain('Atlantis');
  });

  it('rejects an AP quota beyond 2 days of earnings', () => {
    const bad: Quest = { ...valid, requirements: { apQuota: 99, taskCount: 0, habitCount: 0 } };
    expect(validateQuest(bad, ctx).valid).toBe(false);
  });

  it('rejects rewards outside the difficulty band', () => {
    const bad: Quest = { ...valid, reward: { exp: 10000, gold: 10 } };
    expect(validateQuest(bad, ctx).valid).toBe(false);
  });
});

describe('forgeValidatedSideQuest', () => {
  const expenses = [mkExpense('Food', 100)];

  it('succeeds first attempt under a normal context', () => {
    const r = forgeValidatedSideQuest(expenses, ctx, []);
    expect(r.quest).not.toBeNull();
    expect(r.attempts).toBe(1);
  });

  it('repairs an invalid target and succeeds on a later attempt', () => {
    const narrowWorld = { ...DEFAULT_WORLD, enemies: ['Gorgos'] };
    const r = forgeValidatedSideQuest(expenses, { ...ctx, world: narrowWorld }, []);
    expect(r.quest).not.toBeNull();
    expect(r.attempts).toBeGreaterThan(1);
    expect(r.quest!.objectives![0].target).toBe('Gorgos');
    expect(r.log.length).toBeGreaterThan(0);
  });

  it('gives up after 3 attempts when unrepairable', () => {
    const hopeless = { ...DEFAULT_WORLD, enemies: [] as string[] };
    const r = forgeValidatedSideQuest(expenses, { ...ctx, world: hopeless }, []);
    expect(r.quest).toBeNull();
    expect(r.attempts).toBe(3);
  });

  it('skips categories that already have a live side quest', () => {
    const existing = forgeSideQuest(expenses, ctx)!;
    const r = forgeValidatedSideQuest(expenses, ctx, [existing]);
    expect(r.quest).toBeNull();
    expect(r.log.join(' ').toLowerCase()).toContain('duplicate');
  });
});

describe('nextMainQuest', () => {
  it('surfaces the chapter main quest at a town with no live quests', () => {
    const r = nextMainQuest(mkCampaign(), []);
    expect(r.quest?.id).toBe('q0_main');
    expect(r.quest?.requirements?.apQuota).toBe(5);
  });

  it('offers the later chapter quest once progress passes its threshold', () => {
    const done: Quest = { ...(nextMainQuest(mkCampaign(), []).quest as Quest), status: 'completed' };
    const r = nextMainQuest(mkCampaign({ progressPercentage: 10, currentLocation: 'Copper Town' }), [done]);
    expect(r.quest?.id).toBe('q1_main');
  });

  it('stays quiet when a quest is already active or available', () => {
    const active: Quest = { ...(nextMainQuest(mkCampaign(), []).quest as Quest), status: 'active' };
    const r = nextMainQuest(mkCampaign(), [active]);
    expect(r.quest).toBeNull();
    expect(r.rationale.length).toBeGreaterThan(0);
  });

  it('stays quiet outside towns', () => {
    const r = nextMainQuest(mkCampaign({ currentLocation: 'Dark Forest', worldState: 'peace' }), []);
    expect(r.quest).toBeNull();
  });
});
