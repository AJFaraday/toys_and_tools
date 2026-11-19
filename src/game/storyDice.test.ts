import { gameConfig } from './config';
import { rollStoryDice } from './storyDice';
import { sequenceRng } from './testUtils';

describe('rollStoryDice', () => {
  it('picks a face from the config using the rng', () => {
    const faces = gameConfig.storyDice;
    expect(rollStoryDice(sequenceRng(0))).toBe(faces[0]);
    expect(rollStoryDice(sequenceRng(0.9999))).toBe(faces[faces.length - 1]);
  });
});
