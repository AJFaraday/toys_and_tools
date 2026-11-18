import { gameConfig } from './config';
import { countWord, generateSetting, isSettingComplete, needsInput, renderIntro, SettingLine } from './setting';
import { sequenceRng } from './testUtils';

const intro = (overrides: Partial<Record<string, string>> = {}, input?: string): SettingLine[] => [
  { blockId: 'time', leadIn: 'It was a', text: overrides.time ?? 'foggy evening' },
  { blockId: 'activity', leadIn: 'and {count} little {children}', text: 'found a secret tunnel' },
  overrides.meeting
    ? { blockId: 'meeting', leadIn: 'where they met', text: overrides.meeting, inputLabel: 'Which animal?', input }
    : { blockId: 'meeting', leadIn: 'where they met', text: 'a cheeky goblin' },
  { blockId: 'goal', leadIn: 'who wants to', text: 'eat all the cake' },
];

describe('generateSetting', () => {
  it('picks one option from every configured block, in order', () => {
    const setting = generateSetting(() => 0);
    expect(setting.map((line) => line.blockId)).toEqual(gameConfig.settingBlocks.map((b) => b.id));
    setting.forEach((line, i) => {
      expect(line.leadIn).toBe(gameConfig.settingBlocks[i].leadIn);
      expect(line.text).toBe(gameConfig.settingBlocks[i].options[0].text);
    });
  });

  it('carries the input label for options that need input', () => {
    const meeting = gameConfig.settingBlocks.find((b) => b.id === 'meeting')!;
    const index = meeting.options.findIndex((o) => o.inputLabel);
    const blockIndex = gameConfig.settingBlocks.indexOf(meeting);
    const values = gameConfig.settingBlocks.map((b, i) => (i === blockIndex ? index / b.options.length : 0));
    const line = generateSetting(sequenceRng(...values))[blockIndex];
    expect(line).toEqual({ blockId: meeting.id, leadIn: meeting.leadIn, ...meeting.options[index] });
    expect(needsInput(line)).toBe(true);
  });

  it('works with any number of blocks and options', () => {
    const config = {
      ...gameConfig,
      settingBlocks: [{ id: 'only', leadIn: 'Once', options: [{ text: 'a' }, { text: 'b' }, { text: 'c' }] }],
    };
    expect(generateSetting(() => 0.9, config)).toEqual([{ blockId: 'only', leadIn: 'Once', text: 'c' }]);
  });
});

describe('isSettingComplete', () => {
  it('is false before a setting is generated', () => {
    expect(isSettingComplete(null)).toBe(false);
  });

  it('requires any input placeholders to be filled in', () => {
    expect(isSettingComplete(intro())).toBe(true);
    expect(isSettingComplete(intro({ meeting: 'a talking {input}' }))).toBe(false);
    expect(isSettingComplete(intro({ meeting: 'a talking {input}' }, '  '))).toBe(false);
    expect(isSettingComplete(intro({ meeting: 'a talking {input}' }, 'badger'))).toBe(true);
  });
});

describe('renderIntro', () => {
  it('builds the opening paragraph', () => {
    expect(renderIntro(intro(), 3)).toBe(
      'It was a foggy evening, and three little children found a secret tunnel, ' +
        'where they met a cheeky goblin, who wants to eat all the cake.',
    );
  });

  it('uses the number of players', () => {
    expect(renderIntro(intro(), 1)).toContain('and one little child found');
    expect(renderIntro(intro(), 6)).toContain('and six little children found');
  });

  it('inserts free-text input, or a placeholder until it is entered', () => {
    expect(renderIntro(intro({ meeting: 'a talking {input}' }, ' badger '), 2)).toContain('met a talking badger,');
    expect(renderIntro(intro({ meeting: 'a talking {input}' }), 2)).toContain('met a talking …,');
  });

  it('does not treat free-text input as a template', () => {
    expect(renderIntro(intro({ meeting: 'a talking {input}' }, '{count}'), 2)).toContain('met a talking {count},');
  });
});

describe('countWord', () => {
  it('falls back to digits beyond the configured words', () => {
    expect(countWord(2, gameConfig.rules)).toBe('two');
    expect(countWord(99, gameConfig.rules)).toBe('99');
  });
});
