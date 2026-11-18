import { GameConfig, RawConfig, effectiveMaxPlayers, gameConfig, parseConfig } from './config';
import settingJson from '../config/setting.json';
import charactersJson from '../config/characters.json';
import chaptersJson from '../config/chapters.json';
import rulesJson from '../config/rules.json';

const rawConfig = (): RawConfig =>
  JSON.parse(
    JSON.stringify({ setting: settingJson, characters: charactersJson, chapters: chaptersJson, rules: rulesJson }),
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

  it('defaults special ability uses to 2', () => {
    const config = parseConfig(withChange((raw) => delete raw.rules.abilityUsesPerGame));
    expect(config.rules.abilityUsesPerGame).toBe(2);
    expect(parseConfig(withChange((raw) => (raw.rules.abilityUsesPerGame = 4))).rules.abilityUsesPerGame).toBe(4);
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
    ['an unknown ability roll type', (raw) => (raw.characters.abilities[0].rollType = 'magic')],
    ['no chapters', (raw) => (raw.chapters.chapters = [])],
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
