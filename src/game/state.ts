import { GameConfig, effectiveMaxPlayers, gameConfig } from './config';
import { Character } from './characters';
import { RollResult } from './rules';
import { Rng } from './dice';
import { SettingLine, generateSetting, isSettingComplete } from './setting';
import { chapterHasAction } from './chapters';

export type Phase = 'setting' | 'characters' | 'gameplay' | 'complete';

export const PHASES: readonly Phase[] = ['setting', 'characters', 'gameplay', 'complete'];

export interface GameState {
  phase: Phase;
  playerCount: number;
  setting: SettingLine[] | null;
  characters: Character[];
  chapterIndex: number;
  rollsUsed: Record<string, number>;
  lastRoll: Record<string, RollResult>;
  abilityUses: Record<string, number>;
  // Story dice faces by chapter index; rolled once per game, so they stay when changing chapter.
  storyDice: Record<number, string>;
}

export type GameAction =
  | { type: 'SET_PLAYER_COUNT'; count: number }
  | { type: 'GENERATE_SETTING'; setting: SettingLine[] }
  | { type: 'SET_SETTING_INPUT'; blockId: string; input: string }
  | { type: 'START_CHARACTERS' }
  | { type: 'ADD_CHARACTER'; character: Character }
  | { type: 'START_GAMEPLAY' }
  | { type: 'ROLL'; characterId: string; result: RollResult }
  | { type: 'USE_ABILITY'; characterId: string; result: RollResult }
  | { type: 'ROLL_STORY_DICE'; face: string }
  | { type: 'NEXT_CHAPTER' }
  | { type: 'PREV_CHAPTER' }
  | { type: 'FINISH' }
  | { type: 'RESET' };

export const createInitialState = (config: GameConfig = gameConfig): GameState => ({
  phase: 'setting',
  playerCount: config.rules.defaultPlayers,
  setting: null,
  characters: [],
  chapterIndex: 0,
  rollsUsed: {},
  lastRoll: {},
  abilityUses: {},
  storyDice: {},
});

export const rollsRemaining = (state: GameState, characterId: string, config: GameConfig = gameConfig): number =>
  Math.max(0, config.rules.rollsPerChapter - (state.rollsUsed[characterId] ?? 0));

export const abilityUsesRemaining = (state: GameState, characterId: string, config: GameConfig = gameConfig): number =>
  Math.max(0, config.rules.abilityUsesPerGame - (state.abilityUses[characterId] ?? 0));

const recordRoll = (state: GameState, characterId: string, result: RollResult): GameState => ({
  ...state,
  rollsUsed: { ...state.rollsUsed, [characterId]: (state.rollsUsed[characterId] ?? 0) + 1 },
  lastRoll: { ...state.lastRoll, [characterId]: result },
});

export const isLastChapter = (state: GameState, config: GameConfig = gameConfig): boolean =>
  state.chapterIndex === config.chapters.length - 1;

const changeChapter = (state: GameState, chapterIndex: number): GameState =>
  chapterIndex === state.chapterIndex ? state : { ...state, chapterIndex, rollsUsed: {}, lastRoll: {} };

export const createGameReducer =
  (config: GameConfig = gameConfig) =>
  (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'SET_PLAYER_COUNT': {
        if (state.phase !== 'setting') return state;
        const count = Math.min(Math.max(action.count, config.rules.minPlayers), effectiveMaxPlayers(config));
        return Number.isInteger(count) ? { ...state, playerCount: count } : state;
      }
      case 'GENERATE_SETTING':
        if (state.phase !== 'setting' || state.setting !== null) return state;
        return { ...state, setting: action.setting };
      case 'SET_SETTING_INPUT':
        if (state.phase !== 'setting' || state.setting === null) return state;
        return {
          ...state,
          setting: state.setting.map((line) =>
            line.blockId === action.blockId ? { ...line, input: action.input } : line,
          ),
        };
      case 'START_CHARACTERS':
        if (state.phase !== 'setting' || !isSettingComplete(state.setting)) return state;
        return { ...state, phase: 'characters' };
      case 'ADD_CHARACTER':
        if (state.phase !== 'characters' || state.characters.length >= state.playerCount) return state;
        return { ...state, characters: [...state.characters, action.character] };
      case 'START_GAMEPLAY':
        if (state.phase !== 'characters' || state.characters.length !== state.playerCount) return state;
        return { ...state, phase: 'gameplay', chapterIndex: 0, rollsUsed: {}, lastRoll: {}, abilityUses: {}, storyDice: {} };
      case 'ROLL': {
        const { characterId, result } = action;
        if (state.phase !== 'gameplay') return state;
        if (!state.characters.some((c) => c.id === characterId)) return state;
        if (rollsRemaining(state, characterId, config) === 0) return state;
        return recordRoll(state, characterId, result);
      }
      // Using an ability is a roll of the ability's type. It is limited per game, separately from
      // the chapter's rolls.
      case 'USE_ABILITY': {
        const { characterId, result } = action;
        const character = state.characters.find((c) => c.id === characterId);
        if (state.phase !== 'gameplay' || !character) return state;
        if (result.rollType !== character.ability.rollType) return state;
        if (abilityUsesRemaining(state, characterId, config) === 0) return state;
        return {
          ...state,
          lastRoll: { ...state.lastRoll, [characterId]: { ...result, ability: character.ability.name } },
          abilityUses: { ...state.abilityUses, [characterId]: (state.abilityUses[characterId] ?? 0) + 1 },
        };
      }
      case 'ROLL_STORY_DICE': {
        const { chapterIndex } = state;
        if (state.phase !== 'gameplay' || !chapterHasAction(chapterIndex, 'StoryDice', config)) return state;
        if (state.storyDice[chapterIndex] !== undefined || !config.storyDice.includes(action.face)) return state;
        return { ...state, storyDice: { ...state.storyDice, [chapterIndex]: action.face } };
      }
      case 'NEXT_CHAPTER':
        if (state.phase !== 'gameplay') return state;
        return changeChapter(state, Math.min(state.chapterIndex + 1, config.chapters.length - 1));
      case 'PREV_CHAPTER':
        if (state.phase !== 'gameplay') return state;
        return changeChapter(state, Math.max(state.chapterIndex - 1, 0));
      case 'FINISH':
        if (state.phase !== 'gameplay' || !isLastChapter(state, config)) return state;
        return { ...createInitialState(config), phase: 'complete' };
      case 'RESET':
        return createInitialState(config);
      default:
        return state;
    }
  };

export const gameReducer = createGameReducer();

// The action that moves the game on to its next step, or null when the players must fill in a form first.
export const advanceAction = (state: GameState, rng: Rng, config: GameConfig = gameConfig): GameAction | null => {
  switch (state.phase) {
    case 'setting':
      if (state.setting === null) return { type: 'GENERATE_SETTING', setting: generateSetting(rng, config) };
      return isSettingComplete(state.setting) ? { type: 'START_CHARACTERS' } : null;
    case 'characters':
      return state.characters.length >= state.playerCount ? { type: 'START_GAMEPLAY' } : null;
    case 'gameplay':
      return isLastChapter(state, config) ? { type: 'FINISH' } : { type: 'NEXT_CHAPTER' };
    case 'complete':
      return { type: 'RESET' };
    default:
      return null;
  }
};
