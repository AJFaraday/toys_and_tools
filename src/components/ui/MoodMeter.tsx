import { useMemo } from 'react';
import { RollType } from '../../game/config';
import { MAX_ROLL, MIN_ROLL } from '../../game/dice';
import { meterIntroDelays, meterIntroFrame } from './meterIntro';
import { useTimeline } from './motion';

interface Props {
  mood: number;
  // Where the rolled total marker is, if a roll is being shown.
  token?: number;
  rollType?: RollType;
  outcome?: 'pass' | 'fail';
  // Play the intro (fill, bounce at both ends, settle on the mood) after this many milliseconds.
  introDelay?: number;
}

const zone = (n: number, mood: number): string => {
  if (n === mood) return 'meter__cell--mood';
  return n < mood ? 'meter__cell--tools' : 'meter__cell--toys';
};

// Every possible roll from low to high. Tools pass at or below the mood (left), toys at or above it (right).
export const MoodMeter = ({ mood, token, rollType, outcome, introDelay }: Props) => {
  const intro = introDelay !== undefined;
  const delays = useMemo(() => (intro ? meterIntroDelays(mood, introDelay) : []), [intro, mood, introDelay]);
  const { step, done } = useTimeline(delays, mood, intro);
  const frame = done ? null : meterIntroFrame(step, mood);
  const shownMood = frame?.cursor ?? mood;

  const cells = Array.from({ length: MAX_ROLL - MIN_ROLL + 1 }, (_, i) => MIN_ROLL + i);
  const inTrail = (n: number) => token !== undefined && n !== mood && (n - mood) * (n - token) <= 0;
  const passZone = (n: number) =>
    rollType === undefined || (rollType === 'toys' ? n >= mood : n <= mood);
  const empty = (n: number) => !done && (frame === null || (frame.filling && n > frame.cursor));

  return (
    <span
      className={['meter', rollType && `meter--${rollType}`, intro && (done ? 'meter--settled' : 'meter--intro')]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      {cells.map((n) => (
        <span
          key={n}
          className={[
            'meter__cell',
            empty(n) ? 'meter__cell--empty' : zone(n, shownMood),
            frame?.bounce && n === shownMood ? `meter__cell--bounce-${frame.bounce}` : '',
            passZone(n) ? '' : 'meter__cell--dim',
            inTrail(n) ? 'meter__cell--trail' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="meter__number">{n}</span>
          {n === token && <span className={`meter__token${outcome ? ` meter__token--${outcome}` : ''}`} />}
        </span>
      ))}
    </span>
  );
};
