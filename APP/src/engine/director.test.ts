import { describe, it, expect } from 'vitest';
import { Director, travelCost, type DirectorAction } from './director';
import { memoryStorage } from './traceHub';
import type { CampaignState, Expense, Habit, Quest, PlayerStats, PartyMember, BudgetStream } from '../types/schemas';

const day = (d: number, month = 6) => new Date(2026, month, d, 12).getTime();

const mkHabit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1', name: 'Log expenses', streak: 3, lastCompleted: 0, skipCount: 0, difficulty: 1, ...over,
});

const mkBudget = (): BudgetStream => ({ id: 'b1', category: 'Food', allocatedAmount: 500, spentAmount: 100 });

const mkCampaign = (over: Partial<CampaignState> = {}): CampaignState => ({
  currentLocation: 'Starting Village', progressPercentage: 0, worldState: 'town', ...over,
});

const mkExpense = (category: string, amount: number): Expense => ({
  id: `e-${category}-${amount}`, amount, category, description: '', timestamp: day(4),
});

const mkStats = (over: Partial<PlayerStats> = {}): PlayerStats => ({
  level: 1, exp: 0, ap: 10, gold: 0, monthlyBudget: 3000, ...over,
});

const mkMember = (over: Partial<PartyMember> = {}): PartyMember => ({
  id: 'p1', name: 'Althea', avatar: '', role: 'Leader',
  level: 1, hp: 100, maxHp: 100, mp: 20, maxMp: 20, attack: 12, defense: 5, equipment: {}, ...over,
});

const offerOf = (actions: DirectorAction[]) =>
  actions.filter(a => a.kind === 'offer-quest') as Extract<DirectorAction, { kind: 'offer-quest' }>[];

describe('travelCost', () => {
  it('derives cost from map distance (divisor 7), cheaper than the legacy flat 20', () => {
    // Pinned economy (Phase 9 re-position): hops land 6-9 AP, still <= the legacy 20
    // and near the +8 AP from one logged expense.
    expect(travelCost('Starting Village', 'Copper Town')).toBe(9);
    expect(travelCost('Copper Town', 'Silver City')).toBe(8);
    expect(travelCost('Silver City', 'Iron Citadel')).toBe(7);
    expect(travelCost('Starting Village', 'Iron Citadel')).toBe(6);
    expect(travelCost('Starting Village', 'Silver City')).toBe(6);
  });

  it('is symmetric and falls back to 20 for unknown places', () => {
    expect(travelCost('Starting Village', 'Iron Citadel')).toBe(travelCost('Iron Citadel', 'Starting Village'));
    expect(travelCost('Starting Village', 'Atlantis')).toBe(20);
  });
});

describe('Director boot / day tick', () => {
  it('first boot records lastSeen without penalties', () => {
    const d = new Director(memoryStorage());
    const actions = d.onEvent({ type: 'boot', now: day(4), habits: [mkHabit()], budgets: [mkBudget()] });
    expect(actions.find(a => a.kind === 'apply-day-tick')).toBeUndefined();
  });

  it('later boot applies missed-day penalties and traces the decision', () => {
    const storage = memoryStorage();
    const d1 = new Director(storage);
    d1.onEvent({ type: 'boot', now: day(1), habits: [mkHabit()], budgets: [mkBudget()] });

    const d2 = new Director(storage);
    const actions = d2.onEvent({ type: 'boot', now: day(4), habits: [mkHabit()], budgets: [mkBudget()] });
    const tick = actions.find(a => a.kind === 'apply-day-tick');
    expect(tick).toBeDefined();
    if (tick?.kind === 'apply-day-tick') {
      expect(tick.missedDays).toBe(3);
      expect(tick.habits[0].skipCount).toBe(3);
      expect(tick.habits[0].streak).toBe(0);
    }
    expect(d2.getTraces().length).toBeGreaterThan(0);
    const t = d2.getTraces()[d2.getTraces().length - 1];
    expect(t.observe && t.infer && t.decide && t.act && t.rationale).toBeTruthy();
  });
});

describe('Director quest offers', () => {
  it('offers the chapter main quest when idle at a town', () => {
    const d = new Director(memoryStorage());
    const actions = d.onEvent({
      type: 'world-changed',
      campaign: mkCampaign(),
      quests: [],
      expenses: [],
    });
    const offers = offerOf(actions);
    expect(offers).toHaveLength(1);
    expect(offers[0].quest.id).toBe('q0_main');
  });

  it('offers a spending-themed side quest while the main quest is active', () => {
    const d = new Director(memoryStorage());
    const mainActive: Quest = { ...offerOf(
      d.onEvent({ type: 'world-changed', campaign: mkCampaign(), quests: [], expenses: [] })
    )[0].quest, status: 'active' };

    const actions = d.onEvent({
      type: 'world-changed',
      campaign: mkCampaign(),
      quests: [mainActive],
      expenses: [mkExpense('Food', 120), mkExpense('Bills', 30)],
    });
    const offers = offerOf(actions);
    expect(offers).toHaveLength(1);
    expect(offers[0].quest.title).toBe('The Food Menace');
    expect(offers[0].quest.type).toBe('side');
  });

  it('does not re-offer an existing side quest', () => {
    const d = new Director(memoryStorage());
    const expenses = [mkExpense('Food', 120)];
    const side = offerOf(
      d.onEvent({
        type: 'world-changed',
        campaign: mkCampaign(),
        quests: [{ id: 'q0_main', status: 'active' } as Quest],
        expenses,
      })
    )[0].quest;

    const actions = d.onEvent({
      type: 'world-changed',
      campaign: mkCampaign(),
      quests: [{ id: 'q0_main', status: 'active' } as Quest, side],
      expenses,
    });
    expect(offerOf(actions)).toHaveLength(0);
  });

  it('stays silent mid-battle', () => {
    const d = new Director(memoryStorage());
    const actions = d.onEvent({
      type: 'world-changed',
      campaign: mkCampaign({ worldState: 'battle' }),
      quests: [],
      expenses: [],
    });
    expect(offerOf(actions)).toHaveLength(0);
  });
});

describe('Director battles', () => {
  it('spawns a difficulty-scaled bestiary enemy with an archetype', () => {
    const d = new Director(memoryStorage());
    const actions = d.onEvent({ type: 'battle-requested', progress: 0 });
    const spawn = actions.find(a => a.kind === 'spawn-enemy');
    expect(spawn).toBeDefined();
    if (spawn?.kind === 'spawn-enemy') {
      expect(spawn.enemy.archetype).toBeDefined();
      expect(spawn.enemy.maxHp).toBe(spawn.enemy.hp);
      expect(spawn.rationale.length).toBeGreaterThan(0);
    }
  });

  it('rotates enemies as battles are fought', () => {
    const d = new Director(memoryStorage());
    const first = d.onEvent({ type: 'battle-requested', progress: 0 });
    d.onEvent({
      type: 'battle-finished', won: true, strikes: 4, potionsUsed: 0, distinctStrikers: 2,
      stats: mkStats(), party: [mkMember()],
    });
    const second = d.onEvent({ type: 'battle-requested', progress: 0 });
    const name = (a: DirectorAction[]) =>
      (a.find(x => x.kind === 'spawn-enemy') as Extract<DirectorAction, { kind: 'spawn-enemy' }>).enemy.name;
    expect(name(second)).not.toBe(name(first));
  });

  it('pays scaled rewards and levels up the player on victory', () => {
    const d = new Director(memoryStorage());
    const actions = d.onEvent({
      type: 'battle-finished', won: true, strikes: 3, potionsUsed: 0, distinctStrikers: 3,
      stats: mkStats({ exp: 90 }), party: [mkMember()],
    });
    const reward = actions.find(a => a.kind === 'battle-reward');
    expect(reward).toBeDefined();
    if (reward?.kind === 'battle-reward') {
      expect(reward.exp).toBeGreaterThan(0);
      expect(reward.gold).toBeGreaterThan(0);
      expect(reward.stats.level).toBeGreaterThan(1); // 90 + reward exp crosses 100
      expect(reward.levelsGained).toBeGreaterThanOrEqual(1);
      expect(reward.party[0].maxHp).toBeGreaterThan(100);
    }
    expect(d.getSignals().combatWinRate).toBeGreaterThan(0.5);
  });

  it('tracks losses in signals without paying rewards', () => {
    const d = new Director(memoryStorage());
    const actions = d.onEvent({
      type: 'battle-finished', won: false, strikes: 6, potionsUsed: 2, distinctStrikers: 1,
      stats: mkStats(), party: [mkMember()],
    });
    expect(actions.find(a => a.kind === 'battle-reward')).toBeUndefined();
    expect(d.getSignals().lossStreak).toBe(1);
  });

  it('persists signals across director instances', () => {
    const storage = memoryStorage();
    const d1 = new Director(storage);
    d1.onEvent({
      type: 'battle-finished', won: false, strikes: 6, potionsUsed: 0, distinctStrikers: 1,
      stats: mkStats(), party: [mkMember()],
    });
    const d2 = new Director(storage);
    expect(d2.getSignals().lossStreak).toBe(1);
  });
});

describe('Director economy signals', () => {
  it('records AP earn/spend for questForge budgeting', () => {
    const d = new Director(memoryStorage());
    d.onEvent({ type: 'expense-logged', now: day(4), apEarned: 8 });
    d.onEvent({ type: 'ap-spent', amount: 5 });
    expect(d.getSignals().apEarnedTotal).toBe(8);
    expect(d.getSignals().apSpentTotal).toBe(5);
  });

  it('records habit and task completions', () => {
    const d = new Director(memoryStorage());
    d.onEvent({ type: 'habit-completed', apEarned: 10 });
    d.onEvent({ type: 'task-completed', apEarned: 10 });
    expect(d.getSignals().habitCompletionRate).toBeGreaterThan(0.5);
    expect(d.getSignals().taskCompletionRate).toBeGreaterThan(0.5);
  });
});

describe('Director recruitment', () => {
  const party = () => [
    mkMember(),
    mkMember({ id: 'p3', name: 'Elora', role: 'Arcanist' }),
  ];

  it('approves a recruit in town with enough gold and traces the signing', () => {
    const d = new Director(memoryStorage());
    const actions = d.onEvent({ type: 'recruit-requested', slot: 'front', party: party(), gold: 500, worldState: 'town' });
    expect(actions).toHaveLength(1);
    const a = actions[0];
    expect(a.kind).toBe('recruit-member');
    if (a.kind === 'recruit-member') {
      expect(a.member.role).toBe('Vanguard');
      expect(a.cost).toBe(120);
    }
    const last = d.getTraces().at(-1)!;
    expect(last.act).toContain('Recruit');
    expect(last.rationale).toBeTruthy();
  });

  it('denies a recruit outside town with a traced reason', () => {
    const d = new Director(memoryStorage());
    const actions = d.onEvent({ type: 'recruit-requested', slot: 'front', party: party(), gold: 500, worldState: 'peace' });
    expect(actions[0].kind).toBe('deny');
    expect(d.getTraces().at(-1)!.decide.toLowerCase()).toContain('deny');
  });

  it('dismisses regular members but never the leader', () => {
    const d = new Director(memoryStorage());
    const ok = d.onEvent({ type: 'dismiss-requested', memberId: 'p3', party: party() });
    expect(ok[0].kind).toBe('dismiss-member');
    const no = d.onEvent({ type: 'dismiss-requested', memberId: 'p1', party: party() });
    expect(no[0].kind).toBe('deny');
  });
});
