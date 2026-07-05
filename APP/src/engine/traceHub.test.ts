import { describe, it, expect } from 'vitest';
import { TraceHub, TRACE_LIMIT, memoryStorage } from './traceHub';

const sample = {
  observe: 'Player entered Starting Village with 13 AP.',
  infer: 'No live quests; player is idle at a town.',
  decide: 'Offer chapter main quest.',
  act: 'Queued offer-quest action for q0_main.',
  rationale: 'Towns are where the story advances.',
};

describe('TraceHub', () => {
  it('records a trace with id and timestamp', () => {
    const hub = new TraceHub(memoryStorage());
    const t = hub.record(sample);
    expect(t.id.length).toBeGreaterThan(0);
    expect(t.timestamp).toBeGreaterThan(0);
    expect(hub.all()).toHaveLength(1);
    expect(hub.all()[0].observe).toBe(sample.observe);
  });

  it('caps the buffer at TRACE_LIMIT, dropping oldest', () => {
    const hub = new TraceHub(memoryStorage());
    for (let i = 0; i < TRACE_LIMIT + 10; i++) {
      hub.record({ ...sample, act: `act-${i}` });
    }
    const all = hub.all();
    expect(all).toHaveLength(TRACE_LIMIT);
    expect(all[all.length - 1].act).toBe(`act-${TRACE_LIMIT + 9}`);
    expect(all[0].act).toBe('act-10');
  });

  it('persists through its storage backend', () => {
    const storage = memoryStorage();
    new TraceHub(storage).record(sample);
    const rehydrated = new TraceHub(storage);
    expect(rehydrated.all()).toHaveLength(1);
  });
});
