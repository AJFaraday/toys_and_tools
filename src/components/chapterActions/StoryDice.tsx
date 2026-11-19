import { useEffect } from 'react';
import { pickRandom } from '../../game/dice';
import { rollStoryDice } from '../../game/storyDice';
import { slowingDelays, useMotion, useMountValue, useTimeline } from '../ui/motion';
import { ChapterActionProps } from './types';

// Flicks through faces, slowing down as it decides.
const FLICKER_DELAYS = slowingDelays(14, 55, 1.17);

// Rolls as soon as the chapter is shown, once per game: the reducer ignores any later roll.
export const StoryDice = ({ state, dispatch, rng, config }: ChapterActionProps) => {
  const face = state.storyDice[state.chapterIndex];
  const motion = useMotion();
  // Only the first roll flickers; a face rolled earlier (stepping back, or a reload) just appears.
  const rolledEarlier = useMountValue(face !== undefined);
  const animated = motion && !rolledEarlier;
  const { done, skip } = useTimeline(FLICKER_DELAYS, face, animated);

  useEffect(() => {
    if (face === undefined) dispatch({ type: 'ROLL_STORY_DICE', face: rollStoryDice(rng, config) });
  }, [face, dispatch, rng, config]);

  if (face === undefined) return null;
  // The flicker is only for show, so it doesn't use the game's rng.
  const shown = done ? face : pickRandom(config.storyDice, Math.random);

  return (
    <div className="story-dice" onClick={done ? undefined : skip} title={done ? undefined : 'Tap to skip'}>
      <span className={`story-dice__face${done ? (animated ? ' story-dice__face--landed' : '') : ' story-dice__face--rolling'}`} aria-hidden="true">
        {shown}
      </span>
      <p role="status" className="visually-hidden" data-testid="story-dice">
        {done && `Story dice: ${face}`}
      </p>
    </div>
  );
};
