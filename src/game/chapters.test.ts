import { chapterHasAction } from './chapters';
import { gameConfig } from './config';

describe('chapterHasAction', () => {
  it('reports which chapters have an action', () => {
    const twist = gameConfig.chapters.findIndex((c) => c.label === 'TWIST!');
    expect(chapterHasAction(twist, 'StoryDice')).toBe(true);
    expect(chapterHasAction(0, 'StoryDice')).toBe(false);
    expect(chapterHasAction(99, 'StoryDice')).toBe(false);
  });
});
