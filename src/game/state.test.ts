import { Character } from './characters';
import { gameConfig } from './config';
import { RollResult } from './rules';
import { SettingLine } from './setting';
import {
  GameAction,
  GameState,
  abilityUsesRemaining,
  advanceAction,
  createGameReducer,
  createInitialState,
  gameReducer,
  rollsRemaining,
} from './state';

const setting: SettingLine[] = [
  { blockId: 'time', leadIn: 'It was a', text: 'foggy evening' },
  { blockId: 'meeting', leadIn: 'where they met', text: 'a talking {input}', inputLabel: 'Which animal?' },
];

const character = (n: number): Character => ({
  id: `character-${n}`,
  name: `Player ${n}`,
  toy: `Toy ${n}`,
  tool: `Tool ${n}`,
  ability: { name: `Ability ${n}`, rollType: 'toys' },
  mood: 7,
});

const result: RollResult = { rollType: 'toys', dice: [3, 4], total: 7, mood: 7, passed: true, margin: 0 };

const play = (actions: GameAction[], reducer = gameReducer, start = createInitialState()): GameState =>
  actions.reduce(reducer, start);

const toGameplay = (players = 2): GameAction[] => [
  { type: 'SET_PLAYER_COUNT', count: players },
  { type: 'GENERATE_SETTING', setting },
  { type: 'SET_SETTING_INPUT', blockId: 'meeting', input: 'badger' },
  { type: 'START_CHARACTERS' },
  ...Array.from({ length: players }, (_, i): GameAction => ({ type: 'ADD_CHARACTER', character: character(i + 1) })),
  { type: 'START_GAMEPLAY' },
];

describe('setting phase', () => {
  it('starts with the configured default player count', () => {
    expect(createInitialState()).toMatchObject({ phase: 'setting', playerCount: gameConfig.rules.defaultPlayers });
  });

  it('clamps the player count to the allowed range', () => {
    expect(play([{ type: 'SET_PLAYER_COUNT', count: 0 }]).playerCount).toBe(1);
    expect(play([{ type: 'SET_PLAYER_COUNT', count: 99 }]).playerCount).toBe(6);
    expect(play([{ type: 'SET_PLAYER_COUNT', count: 4 }]).playerCount).toBe(4);
    expect(play([{ type: 'SET_PLAYER_COUNT', count: NaN }]).playerCount).toBe(3);
  });

  it('only generates the setting once', () => {
    const other = [{ blockId: 'time', leadIn: 'It was a', text: 'hot day' }];
    const state = play([
      { type: 'GENERATE_SETTING', setting },
      { type: 'GENERATE_SETTING', setting: other },
    ]);
    expect(state.setting).toBe(setting);
  });

  it('needs inputs filled before moving to character creation', () => {
    const generated = play([{ type: 'GENERATE_SETTING', setting }, { type: 'START_CHARACTERS' }]);
    expect(generated.phase).toBe('setting');

    const filled = play(
      [{ type: 'SET_SETTING_INPUT', blockId: 'meeting', input: 'badger' }, { type: 'START_CHARACTERS' }],
      gameReducer,
      generated,
    );
    expect(filled.phase).toBe('characters');
    expect(filled.setting?.[1].input).toBe('badger');
  });

  it('cannot start character creation without a setting', () => {
    expect(play([{ type: 'START_CHARACTERS' }]).phase).toBe('setting');
  });
});

describe('character phase', () => {
  const inCharacters = play(toGameplay(2).slice(0, 4));

  it('adds characters up to the player count', () => {
    const state = play(
      [1, 2, 3].map((n): GameAction => ({ type: 'ADD_CHARACTER', character: character(n) })),
      gameReducer,
      inCharacters,
    );
    expect(state.characters.map((c) => c.id)).toEqual(['character-1', 'character-2']);
  });

  it('only starts gameplay when every character has been created', () => {
    const one = play([{ type: 'ADD_CHARACTER', character: character(1) }, { type: 'START_GAMEPLAY' }], gameReducer, inCharacters);
    expect(one.phase).toBe('characters');
    const both = play([{ type: 'ADD_CHARACTER', character: character(2) }, { type: 'START_GAMEPLAY' }], gameReducer, one);
    expect(both.phase).toBe('gameplay');
  });

  it('ignores player count changes after the setting phase', () => {
    expect(play([{ type: 'SET_PLAYER_COUNT', count: 5 }], gameReducer, inCharacters).playerCount).toBe(2);
  });
});

describe('gameplay phase', () => {
  const inGame = play(toGameplay(2));
  const roll: GameAction = { type: 'ROLL', characterId: 'character-1', result };

  it('starts on the first chapter', () => {
    expect(inGame).toMatchObject({ phase: 'gameplay', chapterIndex: 0 });
  });

  it('records rolls and the latest result per character', () => {
    const state = play([roll], gameReducer, inGame);
    expect(rollsRemaining(state, 'character-1')).toBe(2);
    expect(rollsRemaining(state, 'character-2')).toBe(3);
    expect(state.lastRoll['character-1']).toBe(result);
  });

  it('limits each character to the configured rolls per chapter', () => {
    const state = play([roll, roll, roll, { ...roll, result: { ...result, total: 12 } }], gameReducer, inGame);
    expect(rollsRemaining(state, 'character-1')).toBe(0);
    expect(state.lastRoll['character-1']).toBe(result);
  });

  it('ignores rolls for unknown characters', () => {
    expect(play([{ type: 'ROLL', characterId: 'nobody', result }], gameReducer, inGame)).toBe(inGame);
  });

  it('resets rolls and results when moving forward or back a chapter', () => {
    const forward = play([roll, { type: 'NEXT_CHAPTER' }], gameReducer, inGame);
    expect(forward.chapterIndex).toBe(1);
    expect(rollsRemaining(forward, 'character-1')).toBe(3);
    expect(forward.lastRoll).toEqual({});

    const back = play([roll, { type: 'PREV_CHAPTER' }], gameReducer, forward);
    expect(back.chapterIndex).toBe(0);
    expect(rollsRemaining(back, 'character-1')).toBe(3);
  });

  it('stays within the configured chapters', () => {
    expect(play([{ type: 'PREV_CHAPTER' }], gameReducer, inGame).chapterIndex).toBe(0);
    const many = Array.from({ length: 20 }, (): GameAction => ({ type: 'NEXT_CHAPTER' }));
    expect(play(many, gameReducer, inGame).chapterIndex).toBe(gameConfig.chapters.length - 1);
  });

  it('keeps rolls when a chapter change has nowhere to go', () => {
    const state = play([roll, { type: 'PREV_CHAPTER' }], gameReducer, inGame);
    expect(rollsRemaining(state, 'character-1')).toBe(2);
  });

  it('only finishes on the last chapter, clearing the game', () => {
    expect(play([{ type: 'FINISH' }], gameReducer, inGame).phase).toBe('gameplay');
    const toEnd = Array.from({ length: gameConfig.chapters.length - 1 }, (): GameAction => ({ type: 'NEXT_CHAPTER' }));
    const finished = play([...toEnd, { type: 'FINISH' }], gameReducer, inGame);
    expect(finished).toEqual({ ...createInitialState(), phase: 'complete' });
  });

  it('uses chapter and roll limits from config', () => {
    const config = {
      ...gameConfig,
      chapters: [{ label: 'Start', actions: [] }, { label: 'End', actions: [] }],
      rules: { ...gameConfig.rules, rollsPerChapter: 1 },
    };
    const reducer = createGameReducer(config);
    const state = play([...toGameplay(2), roll, roll, { type: 'NEXT_CHAPTER' }, { type: 'FINISH' }], reducer, createInitialState(config));
    expect(state.phase).toBe('complete');

    const limited = play([...toGameplay(2), roll], reducer, createInitialState(config));
    expect(rollsRemaining(limited, 'character-1', config)).toBe(0);
  });
});

describe('reset', () => {
  it('returns to a new game from any phase', () => {
    const state = play([...toGameplay(2), { type: 'RESET' }]);
    expect(state).toEqual(createInitialState());
  });
});

describe('advanceAction', () => {
  const next = (state: GameState) => advanceAction(state, () => 0);
  const steps = toGameplay(2);

  it('generates the story, then waits for any questions, then starts character creation', () => {
    const fresh = createInitialState();
    expect(next(fresh)).toMatchObject({ type: 'GENERATE_SETTING' });
    expect(gameReducer(fresh, next(fresh)!).setting).toHaveLength(gameConfig.settingBlocks.length);

    expect(next(play(steps.slice(0, 2)))).toBeNull();
    expect(next(play(steps.slice(0, 3)))).toEqual({ type: 'START_CHARACTERS' });
  });

  it('waits for every character before starting the adventure', () => {
    expect(next(play(steps.slice(0, 5)))).toBeNull();
    expect(next(play(steps.slice(0, 6)))).toEqual({ type: 'START_GAMEPLAY' });
  });

  it('moves through the chapters, finishes, then starts a new game', () => {
    let state = play(steps);
    for (let i = 1; i < gameConfig.chapters.length; i += 1) {
      expect(next(state)).toEqual({ type: 'NEXT_CHAPTER' });
      state = gameReducer(state, next(state)!);
    }
    expect(next(state)).toEqual({ type: 'FINISH' });
    state = gameReducer(state, next(state)!);
    expect(state.phase).toBe('complete');
    expect(next(state)).toEqual({ type: 'RESET' });
  });
});

describe('special abilities', () => {
  const inGame = play(toGameplay(2));
  const useAbility: GameAction = { type: 'USE_ABILITY', characterId: 'character-1', result };

  it('starts with the configured number of uses', () => {
    expect(abilityUsesRemaining(inGame, 'character-1')).toBe(gameConfig.rules.abilityUsesPerGame);
  });

  it('records the roll with the ability name without using up a chapter roll', () => {
    const state = play([useAbility], gameReducer, inGame);
    expect(abilityUsesRemaining(state, 'character-1')).toBe(1);
    expect(abilityUsesRemaining(state, 'character-2')).toBe(2);
    expect(rollsRemaining(state, 'character-1')).toBe(3);
    expect(state.lastRoll['character-1']).toEqual({ ...result, ability: 'Ability 1' });
  });

  it('limits uses across the whole game, not per chapter', () => {
    const state = play([useAbility, { type: 'NEXT_CHAPTER' }, useAbility, { type: 'NEXT_CHAPTER' }, useAbility], gameReducer, inGame);
    expect(abilityUsesRemaining(state, 'character-1')).toBe(0);
    expect(rollsRemaining(state, 'character-1')).toBe(3);
    expect(state.lastRoll['character-1']).toBeUndefined();

    expect(abilityUsesRemaining(play([{ type: 'PREV_CHAPTER' }], gameReducer, state), 'character-1')).toBe(0);
  });

  it('can be used when the chapter rolls have run out', () => {
    const roll: GameAction = { type: 'ROLL', characterId: 'character-1', result };
    const state = play([roll, roll, roll, useAbility], gameReducer, inGame);
    expect(abilityUsesRemaining(state, 'character-1')).toBe(1);
    expect(rollsRemaining(state, 'character-1')).toBe(0);
    expect(state.lastRoll['character-1'].ability).toBe('Ability 1');
  });

  it('must use the roll type of the ability', () => {
    const wrongType: GameAction = { ...useAbility, result: { ...result, rollType: 'tools' } };
    expect(play([wrongType], gameReducer, inGame)).toBe(inGame);
  });

  it('ignores unknown characters and other phases', () => {
    expect(play([{ ...useAbility, characterId: 'nobody' }], gameReducer, inGame)).toBe(inGame);
    const inCharacters = play(toGameplay(2).slice(0, 6));
    expect(play([useAbility], gameReducer, inCharacters)).toBe(inCharacters);
  });

  it('uses the configured limit', () => {
    const config = { ...gameConfig, rules: { ...gameConfig.rules, abilityUsesPerGame: 5 } };
    const reducer = createGameReducer(config);
    const state = play([...toGameplay(2), useAbility], reducer, createInitialState(config));
    expect(abilityUsesRemaining(state, 'character-1', config)).toBe(4);
  });
});

describe('story dice', () => {
  const twist = gameConfig.chapters.findIndex((c) => c.actions.includes('StoryDice'));
  const toTwist: GameAction[] = [
    ...toGameplay(1),
    ...Array.from({ length: twist }, (): GameAction => ({ type: 'NEXT_CHAPTER' })),
  ];
  const [dragon, unicorn] = gameConfig.storyDice;
  const rollDice = (face: string): GameAction => ({ type: 'ROLL_STORY_DICE', face });

  it('records one face for a story dice chapter, with no re-roll', () => {
    const state = play([...toTwist, rollDice(dragon), rollDice(unicorn)]);
    expect(state.storyDice).toEqual({ [twist]: dragon });
  });

  it('keeps the face when stepping back and forward', () => {
    const state = play([...toTwist, rollDice(dragon), { type: 'PREV_CHAPTER' }, { type: 'NEXT_CHAPTER' }, rollDice(unicorn)]);
    expect(state.chapterIndex).toBe(twist);
    expect(state.storyDice).toEqual({ [twist]: dragon });
  });

  it('ignores rolls outside a story dice chapter, or with an unknown face', () => {
    expect(play([...toGameplay(1), rollDice(dragon)]).storyDice).toEqual({});
    expect(play([rollDice(dragon)]).storyDice).toEqual({});
    expect(play([...toTwist, rollDice('🍕')]).storyDice).toEqual({});
  });

  it('is cleared by a reset', () => {
    expect(play([...toTwist, rollDice(dragon), { type: 'RESET' }]).storyDice).toEqual({});
  });
});
