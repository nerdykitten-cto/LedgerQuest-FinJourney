import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscribeCampaign, updateCampaign, updateStats } from './persistenceService';
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
