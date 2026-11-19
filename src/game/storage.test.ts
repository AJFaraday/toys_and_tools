import { createInitialState } from './state';
import {
  NAMES_STORAGE_KEY,
  STORAGE_KEY,
  clearGame,
  loadGame,
  loadNames,
  saveGame,
  saveName,
} from './storage';

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

describe('saved character names', () => {
  it('returns no names when nothing is saved', () => {
    expect(loadNames()).toEqual([]);
  });

  it('saves names by player position, replacing earlier names', () => {
    saveName(0, 'Alice');
    saveName(1, 'Bob');
    saveName(0, 'Ada');
    expect(loadNames()).toEqual(['Ada', 'Bob']);
  });

  it('fills gaps when a later position is saved first', () => {
    saveName(2, 'Cara');
    expect(loadNames()).toEqual(['', '', 'Cara']);
  });

  it('keeps names when the game is cleared', () => {
    saveName(0, 'Alice');
    clearGame();
    expect(loadNames()).toEqual(['Alice']);
  });

  it('ignores corrupt or unexpected data', () => {
    window.localStorage.setItem(NAMES_STORAGE_KEY, '{not json');
    expect(loadNames()).toEqual([]);
    window.localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify({ name: 'Alice' }));
    expect(loadNames()).toEqual([]);
    window.localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify(['Alice', 7]));
    expect(loadNames()).toEqual(['Alice', '']);
  });

  it('copes with storage being unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('no');
      },
      setItem: () => {
        throw new Error('no');
      },
    } as unknown as Storage;
    expect(loadNames(broken)).toEqual([]);
    expect(() => saveName(0, 'Alice', broken)).not.toThrow();
    expect(loadNames(null)).toEqual([]);
  });
});
