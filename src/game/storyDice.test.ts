import { gameConfig } from './config';
import { chapterHasAction, rollStoryDice } from './storyDice';
import { sequenceRng } from './testUtils';

describe('rollStoryDice', () => {
  it('picks a face from the config using the rng', () => {
    const faces = gameConfig.storyDice;
    expect(rollStoryDice(sequenceRng(0))).toBe(faces[0]);
    expect(rollStoryDice(sequenceRng(0.9999))).toBe(faces[faces.length - 1]);
  });
});

describe('chapterHasAction', () => {
  it('reports which chapters have an action', () => {
    const twist = gameConfig.chapters.findIndex((c) => c.label === 'TWIST!');
    expect(chapterHasAction(twist, 'StoryDice')).toBe(true);
    expect(chapterHasAction(0, 'StoryDice')).toBe(false);
    expect(chapterHasAction(99, 'StoryDice')).toBe(false);
  });
});
