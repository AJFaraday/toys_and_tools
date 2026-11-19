import settingJson from '../config/setting.json';
import charactersJson from '../config/characters.json';
import chaptersJson from '../config/chapters.json';
import rulesJson from '../config/rules.json';
import storyDiceJson from '../config/storyDice.json';

export type RollType = 'toys' | 'tools';

export interface SettingOption {
  text: string;
  inputLabel?: string;
}

export interface SettingBlock {
  id: string;
  leadIn: string;
  options: SettingOption[];
}

export interface Ability {
  name: string;
  rollType: RollType;
}

export interface Rules {
  minPlayers: number;
  maxPlayers: number;
  defaultPlayers: number;
  rollsPerChapter: number;
  abilityUsesPerGame: number;
  numberWords: string[];
  childNoun: { singular: string; plural: string };
}

// Components that can be attached to a chapter in chapters.json.
export const CHAPTER_ACTIONS = ['StoryDice'] as const;

export type ChapterAction = (typeof CHAPTER_ACTIONS)[number];

export interface Chapter {
  label: string;
  actions: ChapterAction[];
}

export interface GameConfig {
  settingBlocks: SettingBlock[];
  toys: string[];
  tools: string[];
  abilities: Ability[];
  chapters: Chapter[];
  rules: Rules;
  storyDice: string[];
}

export const INPUT_PLACEHOLDER = '{input}';

export const DEFAULT_ABILITY_USES_PER_GAME = 2;

export interface RawConfig {
  setting: unknown;
  characters: unknown;
  chapters: unknown;
  rules: unknown;
  storyDice: unknown;
}

class ConfigError extends Error {
  constructor(message: string) {
    super(`Invalid game config: ${message}`);
    this.name = 'ConfigError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireString = (value: unknown, path: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ConfigError(`${path} must be a non-empty string`);
  }
  return value;
};

const requireInteger = (value: unknown, path: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ConfigError(`${path} must be a whole number`);
  }
  return value;
};

const requireList = (value: unknown, path: string): unknown[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ConfigError(`${path} must be a non-empty list`);
  }
  return value;
};

const requireUniqueStrings = (value: unknown, path: string): string[] => {
  const list = requireList(value, path).map((item, i) => requireString(item, `${path}[${i}]`));
  if (new Set(list).size !== list.length) {
    throw new ConfigError(`${path} must not contain duplicates`);
  }
  return list;
};

const countOccurrences = (text: string, search: string): number => text.split(search).length - 1;

const parseSettingOption = (value: unknown, path: string): SettingOption => {
  const option: SettingOption =
    typeof value === 'string'
      ? { text: requireString(value, path) }
      : isRecord(value)
        ? {
            text: requireString(value.text, `${path}.text`),
            ...(value.inputLabel !== undefined
              ? { inputLabel: requireString(value.inputLabel, `${path}.inputLabel`) }
              : {}),
          }
        : (() => {
            throw new ConfigError(`${path} must be a string or { text, inputLabel }`);
          })();

  const inputs = countOccurrences(option.text, INPUT_PLACEHOLDER);
  if (inputs > 1) {
    throw new ConfigError(`${path} may contain at most one ${INPUT_PLACEHOLDER}`);
  }
  if (inputs === 1 && !option.inputLabel) {
    throw new ConfigError(`${path} uses ${INPUT_PLACEHOLDER} so it needs an inputLabel`);
  }
  return option;
};

const parseSettingBlocks = (raw: unknown): SettingBlock[] => {
  if (!isRecord(raw)) throw new ConfigError('setting must be an object');
  const blocks = requireList(raw.blocks, 'setting.blocks').map((block, i) => {
    const path = `setting.blocks[${i}]`;
    if (!isRecord(block)) throw new ConfigError(`${path} must be an object`);
    return {
      id: requireString(block.id, `${path}.id`),
      leadIn: requireString(block.leadIn, `${path}.leadIn`),
      options: requireList(block.options, `${path}.options`).map((option, j) =>
        parseSettingOption(option, `${path}.options[${j}]`),
      ),
    };
  });
  if (new Set(blocks.map((b) => b.id)).size !== blocks.length) {
    throw new ConfigError('setting.blocks ids must be unique');
  }
  return blocks;
};

const parseAbilities = (raw: unknown): Ability[] => {
  const abilities = requireList(raw, 'characters.abilities').map((ability, i): Ability => {
    const path = `characters.abilities[${i}]`;
    if (!isRecord(ability)) throw new ConfigError(`${path} must be an object`);
    const rollType = ability.rollType;
    if (rollType !== 'toys' && rollType !== 'tools') {
      throw new ConfigError(`${path}.rollType must be "toys" or "tools"`);
    }
    return { name: requireString(ability.name, `${path}.name`), rollType };
  });
  if (new Set(abilities.map((a) => a.name)).size !== abilities.length) {
    throw new ConfigError('characters.abilities must not contain duplicate names');
  }
  return abilities;
};

const parseRules = (raw: unknown): Rules => {
  if (!isRecord(raw)) throw new ConfigError('rules must be an object');
  const minPlayers = requireInteger(raw.minPlayers, 'rules.minPlayers');
  const maxPlayers = requireInteger(raw.maxPlayers, 'rules.maxPlayers');
  const defaultPlayers = requireInteger(raw.defaultPlayers, 'rules.defaultPlayers');
  const rollsPerChapter = requireInteger(raw.rollsPerChapter, 'rules.rollsPerChapter');
  if (minPlayers < 1) throw new ConfigError('rules.minPlayers must be at least 1');
  if (minPlayers > maxPlayers) throw new ConfigError('rules.minPlayers must not exceed rules.maxPlayers');
  if (defaultPlayers < minPlayers || defaultPlayers > maxPlayers) {
    throw new ConfigError('rules.defaultPlayers must be between minPlayers and maxPlayers');
  }
  if (rollsPerChapter < 1) throw new ConfigError('rules.rollsPerChapter must be at least 1');
  const abilityUsesPerGame =
    raw.abilityUsesPerGame === undefined
      ? DEFAULT_ABILITY_USES_PER_GAME
      : requireInteger(raw.abilityUsesPerGame, 'rules.abilityUsesPerGame');
  if (abilityUsesPerGame < 0) throw new ConfigError('rules.abilityUsesPerGame must not be negative');

  const numberWords = requireList(raw.numberWords, 'rules.numberWords').map((word, i) =>
    requireString(word, `rules.numberWords[${i}]`),
  );
  if (numberWords.length < maxPlayers) {
    throw new ConfigError('rules.numberWords must have a word for every player count up to maxPlayers');
  }

  const childNoun = raw.childNoun;
  if (!isRecord(childNoun)) throw new ConfigError('rules.childNoun must be an object');

  return {
    minPlayers,
    maxPlayers,
    defaultPlayers,
    rollsPerChapter,
    abilityUsesPerGame,
    numberWords,
    childNoun: {
      singular: requireString(childNoun.singular, 'rules.childNoun.singular'),
      plural: requireString(childNoun.plural, 'rules.childNoun.plural'),
    },
  };
};

const isChapterAction = (value: unknown): value is ChapterAction =>
  CHAPTER_ACTIONS.includes(value as ChapterAction);

const parseChapter = (value: unknown, path: string): Chapter => {
  if (typeof value === 'string') return { label: requireString(value, path), actions: [] };
  if (!isRecord(value)) throw new ConfigError(`${path} must be a string or { label, actions }`);
  const rawActions = value.actions === undefined ? [] : value.actions;
  if (!Array.isArray(rawActions)) throw new ConfigError(`${path}.actions must be a list`);
  const actions = rawActions.map((action, i) => {
    if (!isChapterAction(action)) {
      throw new ConfigError(`${path}.actions[${i}] must be one of: ${CHAPTER_ACTIONS.join(', ')}`);
    }
    return action;
  });
  if (new Set(actions).size !== actions.length) {
    throw new ConfigError(`${path}.actions must not contain duplicates`);
  }
  return { label: requireString(value.label, `${path}.label`), actions };
};

const parseChapters = (raw: unknown): Chapter[] => {
  if (!isRecord(raw)) throw new ConfigError('chapters must be an object');
  const chapters = requireList(raw.chapters, 'chapters.chapters').map((chapter, i) =>
    parseChapter(chapter, `chapters.chapters[${i}]`),
  );
  if (new Set(chapters.map((c) => c.label)).size !== chapters.length) {
    throw new ConfigError('chapters.chapters must not contain duplicate labels');
  }
  return chapters;
};

const parseStoryDice = (raw: unknown, required: boolean): string[] => {
  if (raw === undefined && !required) return [];
  if (!isRecord(raw)) throw new ConfigError('storyDice must be an object');
  return requireUniqueStrings(raw.faces, 'storyDice.faces');
};

export const effectiveMaxPlayers = (config: GameConfig): number =>
  Math.min(config.rules.maxPlayers, config.toys.length, config.tools.length, config.abilities.length);

export const parseConfig = (raw: RawConfig): GameConfig => {
  if (!isRecord(raw.characters)) throw new ConfigError('characters must be an object');
  const chapters = parseChapters(raw.chapters);
  const usesStoryDice = chapters.some((c) => c.actions.includes('StoryDice'));

  const config: GameConfig = {
    settingBlocks: parseSettingBlocks(raw.setting),
    toys: requireUniqueStrings(raw.characters.toys, 'characters.toys'),
    tools: requireUniqueStrings(raw.characters.tools, 'characters.tools'),
    abilities: parseAbilities(raw.characters.abilities),
    chapters,
    rules: parseRules(raw.rules),
    storyDice: parseStoryDice(raw.storyDice, usesStoryDice),
  };

  if (effectiveMaxPlayers(config) < config.rules.defaultPlayers) {
    throw new ConfigError(
      'there must be at least rules.defaultPlayers toys, tools and abilities so every character gets unique items',
    );
  }
  return config;
};

export const gameConfig: GameConfig = parseConfig({
  setting: settingJson,
  characters: charactersJson,
  chapters: chaptersJson,
  rules: rulesJson,
  storyDice: storyDiceJson,
});
