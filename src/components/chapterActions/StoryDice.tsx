import { useEffect } from 'react';
import { rollStoryDice } from '../../game/storyDice';
import { ChapterActionProps } from './types';

// Rolls as soon as the chapter is shown, once per game: the reducer ignores any later roll.
export const StoryDice = ({ state, dispatch, rng, config }: ChapterActionProps) => {
  const face = state.storyDice[state.chapterIndex];

  useEffect(() => {
    if (face === undefined) dispatch({ type: 'ROLL_STORY_DICE', face: rollStoryDice(rng, config) });
  }, [face, dispatch, rng, config]);

  if (face === undefined) return null;
  return <p role="status">Story dice: {face}</p>;
};
