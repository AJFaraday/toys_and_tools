import { createInitialState } from './state';
import { STORAGE_KEY, clearGame, loadGame, saveGame } from './storage';

beforeEach(() => window.localStorage.clear());

describe('storage', () => {
  it('saves and loads a game', () => {
    const state = { ...createInitialState(), playerCount: 4 };
    saveGame(state);
    expect(loadGame()).toEqual(state);
  });

  it('returns null when nothing is saved', () => {
    expect(loadGame()).toBeNull();
  });

  it('clears the saved game', () => {
    saveGame(createInitialState());
    clearGame();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('upgrades games saved before special ability uses were tracked', () => {
    const { abilityUses, ...oldSave } = { ...createInitialState(), playerCount: 2 };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(oldSave));
    expect(loadGame()).toEqual({ ...oldSave, abilityUses: {} });
  });

  it('ignores corrupt or unexpected data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadGame()).toBeNull();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ phase: 'dancing' }));
    expect(loadGame()).toBeNull();
  });

  it('copes with storage being unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('no');
      },
      setItem: () => {
        throw new Error('no');
      },
      removeItem: () => {
        throw new Error('no');
      },
    } as unknown as Storage;
    expect(loadGame(broken)).toBeNull();
    expect(() => saveGame(createInitialState(), broken)).not.toThrow();
    expect(() => clearGame(broken)).not.toThrow();
    expect(loadGame(null)).toBeNull();
  });
});
