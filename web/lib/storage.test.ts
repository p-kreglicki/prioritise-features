import { saveState, loadState, clearState, STORAGE_KEY } from './storage';

function mockLocalStorage() {
  const store: Record<string, string> = {};
  const local = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    }
  } as unknown as Storage;
  Object.defineProperty(global, 'window', {
    value: { localStorage: local },
    configurable: true
  });
}

describe('storage helpers', () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  test('save and load state', () => {
    const state = { version: 1, features: [], lastSavedAtIso: new Date().toISOString() };
    saveState(state);
    const loaded = loadState();
    expect(loaded?.version).toBe(1);
  });

  test('clear removes state', () => {
    const state = { version: 1, features: [], lastSavedAtIso: new Date().toISOString() };
    saveState(state);
    clearState();
    const loaded = loadState();
    expect(loaded).toBeNull();
  });
});


