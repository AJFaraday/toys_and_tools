import { GameConfig, RawConfig, effectiveMaxPlayers, gameConfig, parseConfig } from './config';
import settingJson from '../config/setting.json';
import charactersJson from '../config/characters.json';
import chaptersJson from '../config/chapters.json';
import rulesJson from '../config/rules.json';
import storyDiceJson from '../config/storyDice.json';

const rawConfig = (): RawConfig =>
  JSON.parse(
    JSON.stringify({
      setting: settingJson,
      characters: charactersJson,
      chapters: chaptersJson,
      rules: rulesJson,
      storyDice: storyDiceJson,
    }),
  );

describe('game config files', () => {
  it('are valid', () => {
    expect(() => parseConfig(rawConfig())).not.toThrow();
  });

  it('can always give every player unique items', () => {
    expect(effectiveMaxPlayers(gameConfig)).toBeGreaterThanOrEqual(gameConfig.rules.defaultPlayers);
    expect(effectiveMaxPlayers(gameConfig)).toBeGreaterThanOrEqual(gameConfig.rules.minPlayers);
  });

  it('normalises plain string options and options needing input', () => {
    const rawSetting = rawConfig().setting as any;
    const rawOptions: any[] = rawSetting.blocks.find((b: any) => b.id === 'meeting').options;
    const options = gameConfig.settingBlocks.find((b) => b.id === 'meeting')?.options;
    const plain = rawOptions.find((o) => typeof o === 'string');
    const withInput = rawOptions.find((o) => typeof o === 'object');
    expect(options).toContainEqual({ text: plain });
    expect(options).toContainEqual({ text: withInput.text, inputLabel: withInput.inputLabel });
  });
});

describe('parseConfig', () => {
  const withChange = (change: (raw: any) => void): RawConfig => {
    const raw = rawConfig();
    change(raw);
    return raw;
  };

  it('accepts lists of any length', () => {
    const config = parseConfig(
      withChange((raw) => {
        raw.characters.toys.push('Kite', 'Yo-yo');
        raw.chapters.chapters = ['Beginning', 'End'];
        raw.setting.blocks[0].options = ['sunny day'];
      }),
    );
    expect(config.toys).toHaveLength(8);
    expect(config.chapters).toHaveLength(2);
    expect(config.settingBlocks[0].options).toHaveLength(1);
  });

  it('reads toys and tools as names or names with an emoji', () => {
    const config = parseConfig(
      withChange((raw) => {
        raw.characters.toys = ['Kite', { name: 'Ball', emoji: '⚽' }, { name: 'Teddy' }];
        raw.characters.abilities[0].emoji = '🐸';
        delete raw.characters.abilities[1].emoji;
        raw.rules.defaultPlayers = 1;
      }),
    );
    expect(config.toys).toEqual([{ name: 'Kite' }, { name: 'Ball', emoji: '⚽' }, { name: 'Teddy' }]);
    expect(config.abilities[0].emoji).toBe('🐸');
    expect(config.abilities[1]).not.toHaveProperty('emoji');
  });

  it('defaults special ability uses to 2', () => {
    const config = parseConfig(withChange((raw) => delete raw.rules.abilityUsesPerGame));
    expect(config.rules.abilityUsesPerGame).toBe(2);
    expect(parseConfig(withChange((raw) => (raw.rules.abilityUsesPerGame = 4))).rules.abilityUsesPerGame).toBe(4);
  });

  it('reads chapters as plain labels or labels with actions', () => {
    expect(gameConfig.chapters.map((c) => c.label)).toContain('TWIST!');
    expect(gameConfig.chapters.find((c) => c.label === 'TWIST!')?.actions).toEqual(['StoryDice']);
    expect(gameConfig.chapters[0]).toEqual({ label: 'Set the scene', actions: [] });

    const config = parseConfig(
      withChange((raw) => (raw.chapters.chapters = ['Start', { label: 'Middle' }, { label: 'End', actions: [] }])),
    );
    expect(config.chapters).toEqual([
      { label: 'Start', actions: [] },
      { label: 'Middle', actions: [] },
      { label: 'End', actions: [] },
    ]);
  });

  it('only needs story dice faces when a chapter uses them', () => {
    const config = parseConfig(
      withChange((raw) => {
        raw.chapters.chapters = ['Start', 'End'];
        delete raw.storyDice;
      }),
    );
    expect(config.storyDice).toEqual([]);
    expect(gameConfig.storyDice.length).toBeGreaterThan(0);
  });

  it('explains which chapter actions are allowed', () => {
    expect(() => parseConfig(withChange((raw) => (raw.chapters.chapters[0] = { label: 'x', actions: ['Dance'] })))).toThrow(
      'Invalid game config: chapters.chapters[0].actions[0] must be one of: StoryDice',
    );
  });

  it('limits players to the smallest list of items', () => {
    const config: GameConfig = parseConfig(
      withChange((raw) => {
        raw.characters.tools = ['Book', 'Map', 'Torch', 'Rope'];
      }),
    );
    expect(effectiveMaxPlayers(config)).toBe(4);
  });

  it.each<[string, (raw: any) => void]>([
    ['an empty toy list', (raw) => (raw.characters.toys = [])],
    ['duplicate tools', (raw) => (raw.characters.tools = ['Map', 'Map', 'Book'])],
    ['duplicate toy names', (raw) => (raw.characters.toys = ['Ball', { name: 'Ball', emoji: '⚽' }, 'Kite'])],
    ['a toy without a name', (raw) => (raw.characters.toys[0] = { emoji: '🧸' })],
    ['an empty toy emoji', (raw) => (raw.characters.toys[0] = { name: 'Teddy', emoji: ' ' })],
    ['an empty ability emoji', (raw) => (raw.characters.abilities[0].emoji = '')],
    ['an unknown ability roll type', (raw) => (raw.characters.abilities[0].rollType = 'magic')],
    ['no chapters', (raw) => (raw.chapters.chapters = [])],
    ['duplicate chapter labels', (raw) => (raw.chapters.chapters = ['Start', { label: 'Start' }])],
    ['a chapter without a label', (raw) => (raw.chapters.chapters[0] = { actions: [] })],
    ['chapter actions that are not a list', (raw) => (raw.chapters.chapters[0] = { label: 'x', actions: 'StoryDice' })],
    ['duplicate chapter actions', (raw) => (raw.chapters.chapters[0] = { label: 'x', actions: ['StoryDice', 'StoryDice'] })],
    ['story dice with no faces', (raw) => (raw.storyDice.faces = [])],
    ['missing story dice when a chapter uses them', (raw) => delete raw.storyDice],
    ['duplicate story dice faces', (raw) => (raw.storyDice.faces = ['🐉', '🐉'])],
    ['an empty story dice face', (raw) => (raw.storyDice.faces = ['🐉', ' '])],
    ['a block with no options', (raw) => (raw.setting.blocks[0].options = [])],
    ['duplicate block ids', (raw) => (raw.setting.blocks[1].id = raw.setting.blocks[0].id)],
    ['an input option without a label', (raw) => raw.setting.blocks[0].options.push('a {input}')],
    ['an option with two inputs', (raw) => raw.setting.blocks[0].options.push({ text: '{input} {input}', inputLabel: 'x' })],
    ['default players above max', (raw) => (raw.rules.defaultPlayers = 7)],
    ['min players above max', (raw) => (raw.rules.minPlayers = 7)],
    ['zero rolls per chapter', (raw) => (raw.rules.rollsPerChapter = 0)],
    ['negative ability uses', (raw) => (raw.rules.abilityUsesPerGame = -1)],
    ['fractional ability uses', (raw) => (raw.rules.abilityUsesPerGame = 1.5)],
    ['too few number words', (raw) => (raw.rules.numberWords = ['one', 'two'])],
    ['fewer items than default players', (raw) => (raw.characters.toys = ['Teddy', 'Ball'])],
  ])('rejects %s', (_, change) => {
    expect(() => parseConfig(withChange(change))).toThrow(/Invalid game config/);
  });
});
