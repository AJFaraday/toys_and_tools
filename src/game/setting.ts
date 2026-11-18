import { GameConfig, INPUT_PLACEHOLDER, Rules, gameConfig } from './config';
import { Rng, pickRandom } from './dice';

export interface SettingLine {
  blockId: string;
  leadIn: string;
  text: string;
  inputLabel?: string;
  input?: string;
}

export const generateSetting = (rng: Rng, config: GameConfig = gameConfig): SettingLine[] =>
  config.settingBlocks.map((block) => {
    const option = pickRandom(block.options, rng);
    return {
      blockId: block.id,
      leadIn: block.leadIn,
      text: option.text,
      ...(option.inputLabel ? { inputLabel: option.inputLabel } : {}),
    };
  });

export const needsInput = (line: SettingLine): boolean => line.text.includes(INPUT_PLACEHOLDER);

export const isSettingComplete = (setting: SettingLine[] | null): boolean =>
  setting !== null && setting.every((line) => !needsInput(line) || (line.input ?? '').trim() !== '');

export const countWord = (count: number, rules: Rules): string => rules.numberWords[count - 1] ?? String(count);

const MISSING_INPUT = '…';

export const renderIntro = (
  setting: SettingLine[],
  playerCount: number,
  rules: Rules = gameConfig.rules,
): string => {
  const children = playerCount === 1 ? rules.childNoun.singular : rules.childNoun.plural;
  const fillTemplate = (template: string): string =>
    template.split('{count}').join(countWord(playerCount, rules)).split('{children}').join(children);

  const sentence = setting
    .map((line) => {
      const input = (line.input ?? '').trim() || MISSING_INPUT;
      // Fill config placeholders before inserting free text, so user input is never treated as a template.
      return fillTemplate(`${line.leadIn} ${line.text}`).split(INPUT_PLACEHOLDER).join(input);
    })
    .join(', ');
  return `${sentence}.`;
};
