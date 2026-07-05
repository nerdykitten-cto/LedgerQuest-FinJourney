import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscribeCampaign, updateCampaign, updateStats, addHabitDB, removePartyMemberDB, addSavingsGoalDB, resetGameDB, subscribeEngineTraces } from './persistenceService';
import type { CampaignState, PlayerStats } from './types/schemas';

// persistenceService touches localStorage/window lazily inside each function,
// so stubbing globals before each test is sufficient (vitest runs in node).
const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal('window', {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
});

const readCampaign = (): CampaignState => {
  let state: CampaignState | undefined;
  subscribeCampaign(s => { state = s; })();
  return state!;
};

describe('campaign location defaults', () => {
  it('defaults currentLocation to a real map node (Starting Village)', () => {
    expect(readCampaign().currentLocation).toBe('Starting Village');
  });

  it('migrates legacy "Start Town" saves to "Starting Village"', () => {
    store.set('player/campaign', JSON.stringify({ currentLocation: 'Start Town', progressPercentage: 10, worldState: 'peace' }));
    const state = readCampaign();
    expect(state.currentLocation).toBe('Starting Village');
    expect(state.progressPercentage).toBe(10);
  });

  it('updateCampaign on empty storage seeds Starting Village', async () => {
    await updateCampaign({ worldState: 'town' });
    const stored = JSON.parse(store.get('player/campaign')!);
    expect(stored.currentLocation).toBe('Starting Village');
    expect(stored.worldState).toBe('town');
  });
});

describe('updateStats functional updates', () => {
  it('applies updater against current stored stats, not caller snapshot', async () => {
    store.set('player/stats', JSON.stringify({ level: 1, exp: 0, ap: 18, gold: 0 }));
    // Simulates the App.tsx race: three writers fire while React state is stale.
    await updateStats(cur => ({ ap: cur.ap + 10 }));
    await updateStats(cur => ({ ap: cur.ap + 15 }));
    await updateStats(cur => ({ ap: cur.ap - 5 }));
    const stats = JSON.parse(store.get('player/stats')!) as PlayerStats;
    expect(stats.ap).toBe(38); // 18 + 10 + 15 - 5; the old API lost updates here
  });

  it('merges partial updates without clobbering other fields', async () => {
    store.set('player/stats', JSON.stringify({ level: 2, exp: 50, ap: 5, gold: 100 }));
    await updateStats(cur => ({ gold: cur.gold + 25 }));
    const stats = JSON.parse(store.get('player/stats')!) as PlayerStats;
    expect(stats).toMatchObject({ level: 2, exp: 50, ap: 5, gold: 125 });
  });

  it('seeds default stats when storage is empty', async () => {
    await updateStats(cur => ({ ap: cur.ap + 8 }));
    const stats = JSON.parse(store.get('player/stats')!) as PlayerStats;
    expect(stats.ap).toBe(18); // default ap 10 + 8
    expect(stats.level).toBe(1);
  });
});

describe('addHabitDB', () => {
  it('appends a habit and notifies same-tab subscribers', async () => {
    await addHabitDB({ id: 'h9', name: 'No-spend day', streak: 0, lastCompleted: 0, skipCount: 0, difficulty: 2 });
    const habits = JSON.parse(store.get('habits')!);
    expect(habits.map((h: { id: string }) => h.id)).toContain('h9');
    expect((window.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });
});

describe('removePartyMemberDB', () => {
  it('removes exactly the given member', async () => {
    store.set('party', JSON.stringify([
      { id: 'p1', name: 'Althea' }, { id: 'p4', name: 'Thal' },
    ]));
    await removePartyMemberDB('p4');
    const party = JSON.parse(store.get('party')!);
    expect(party).toHaveLength(1);
    expect(party[0].id).toBe('p1');
  });
});

describe('addSavingsGoalDB', () => {
  it('appends a savings goal', async () => {
    await addSavingsGoalDB({ id: 's9', name: 'Rainy Day', targetAmount: 1000, currentAmount: 0 });
    const goals = JSON.parse(store.get('savings')!);
    expect(goals.map((g: { id: string }) => g.id)).toContain('s9');
  });
});

describe('resetGameDB', () => {
  it('clears engine state keys and reseeds the world', async () => {
    store.set('engine_signals', '{"foo":1}');
    store.set('engine_traces', '[]');
    store.set('engine_lastSeen', '123');
    store.set('engine_lastExpenseDay', '123');
    store.set('engine_battleMemory', '{"records":[]}');
    store.set('quests', '[{"id":"stale"}]');
    await resetGameDB();
    expect(store.has('engine_signals')).toBe(false);
    expect(store.has('engine_traces')).toBe(false);
    expect(store.has('engine_lastSeen')).toBe(false);
    expect(store.has('engine_battleMemory')).toBe(false);
    const quests = JSON.parse(store.get('quests')!);
    expect(quests[0].id).not.toBe('stale');
  });
});

describe('subscribeEngineTraces', () => {
  it('reads director traces from engine_traces', () => {
    store.set('engine_traces', JSON.stringify([{ id: 'tr-1', timestamp: 1, observe: 'o', infer: 'i', decide: 'd', act: 'a', rationale: 'r' }]));
    let seen: unknown[] = [];
    subscribeEngineTraces(t => { seen = t; })();
    expect(seen).toHaveLength(1);
  });
});
