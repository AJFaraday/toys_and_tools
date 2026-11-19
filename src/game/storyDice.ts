import { ChapterAction, GameConfig, gameConfig } from './config';
import { Rng, pickRandom } from './dice';

export const rollStoryDice = (rng: Rng, config: GameConfig = gameConfig): string => pickRandom(config.storyDice, rng);

export const chapterHasAction = (chapterIndex: number, action: ChapterAction, config: GameConfig = gameConfig): boolean =>
  config.chapters[chapterIndex]?.actions.includes(action) ?? false;
