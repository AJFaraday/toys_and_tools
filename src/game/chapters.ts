import { ChapterAction, GameConfig, gameConfig } from './config';

export const chapterHasAction = (chapterIndex: number, action: ChapterAction, config: GameConfig = gameConfig): boolean =>
  config.chapters[chapterIndex]?.actions.includes(action) ?? false;
