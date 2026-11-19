import { GameState, PHASES } from './state';

export const STORAGE_KEY = 'toys-and-tools:v1';
// Kept separately from the game so names survive resets and finished games.
export const NAMES_STORAGE_KEY = 'toys-and-tools:names:v1';

const getStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isGameState = (value: unknown): value is GameState =>
  isRecord(value) &&
  PHASES.includes(value.phase as GameState['phase']) &&
  typeof value.playerCount === 'number' &&
  (value.setting === null || Array.isArray(value.setting)) &&
  Array.isArray(value.characters) &&
  typeof value.chapterIndex === 'number' &&
  isRecord(value.rollsUsed) &&
  isRecord(value.lastRoll) &&
  isRecord(value.abilityUses);

// Fills in fields added since a game may have been saved, so games in progress survive upgrades.
const upgrade = (value: unknown): unknown =>
  isRecord(value) && value.abilityUses === undefined ? { ...value, abilityUses: {} } : value;

export const loadGame = (storage: Storage | null = getStorage()): GameState | null => {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed = upgrade(JSON.parse(raw));
    return isGameState(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveGame = (state: GameState, storage: Storage | null = getStorage()): void => {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be full or unavailable (e.g. private browsing); the game still works in memory.
  }
};

export const clearGame = (storage: Storage | null = getStorage()): void => {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
};

// Names are stored by player position, so each player gets their name back next game.
export const loadNames = (storage: Storage | null = getStorage()): string[] => {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(NAMES_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.map((name) => (typeof name === 'string' ? name : '')) : [];
  } catch {
    return [];
  }
};

export const saveName = (index: number, name: string, storage: Storage | null = getStorage()): void => {
  const names = loadNames(storage);
  while (names.length < index) names.push('');
  names[index] = name;
  try {
    storage?.setItem(NAMES_STORAGE_KEY, JSON.stringify(names));
  } catch {
    // Ignore unavailable storage; the name just won't be remembered.
  }
};
