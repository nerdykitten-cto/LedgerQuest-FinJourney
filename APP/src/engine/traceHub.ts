/**
 * Unified decision trace for the Game Director. Every engine decision is
 * recorded as observe -> infer -> decide -> act with a rationale, kept in a
 * persisted ring buffer so the (Phase 3) trace viewer can replay them.
 */

export interface DirectorTrace {
  id: string;
  timestamp: number;
  observe: string;
  infer: string;
  decide: string;
  act: string;
  rationale: string;
}

export const TRACE_LIMIT = 100;

export interface EngineStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
}

/** In-memory backend for tests and non-browser contexts. */
export const memoryStorage = (): EngineStorage => {
  const data = new Map<string, unknown>();
  return {
    get: <T>(key: string, fallback: T): T => (data.has(key) ? (data.get(key) as T) : fallback),
    set: (key, value) => void data.set(key, value),
  };
};

/** localStorage backend, mirroring persistenceService's same-tab reactivity event. */
export const localStorageBackend = (): EngineStorage => ({
  get: <T>(key: string, fallback: T): T => {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('storage'));
  },
});

const TRACES_KEY = 'engine_traces';

export class TraceHub {
  private storage: EngineStorage;

  constructor(storage: EngineStorage) {
    this.storage = storage;
  }

  record(input: Omit<DirectorTrace, 'id' | 'timestamp'>): DirectorTrace {
    const trace: DirectorTrace = {
      ...input,
      id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    const all = [...this.all(), trace].slice(-TRACE_LIMIT);
    this.storage.set(TRACES_KEY, all);
    return trace;
  }

  all(): DirectorTrace[] {
    return this.storage.get<DirectorTrace[]>(TRACES_KEY, []);
  }
}
