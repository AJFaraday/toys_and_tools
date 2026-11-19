import { RollType } from '../../game/config';
import { MAX_ROLL, MIN_ROLL } from '../../game/dice';

interface Props {
  mood: number;
  // Where the rolled total marker is, if a roll is being shown.
  token?: number;
  rollType?: RollType;
  outcome?: 'pass' | 'fail';
}

const zone = (n: number, mood: number): string => {
  if (n === mood) return 'meter__cell--mood';
  return n < mood ? 'meter__cell--tools' : 'meter__cell--toys';
};

// Every possible roll from low to high. Tools pass at or below the mood (left), toys at or above it (right).
export const MoodMeter = ({ mood, token, rollType, outcome }: Props) => {
  const cells = Array.from({ length: MAX_ROLL - MIN_ROLL + 1 }, (_, i) => MIN_ROLL + i);
  const inTrail = (n: number) => token !== undefined && n !== mood && (n - mood) * (n - token) <= 0;
  const passZone = (n: number) =>
    rollType === undefined || (rollType === 'toys' ? n >= mood : n <= mood);

  return (
    <span className={`meter${rollType ? ` meter--${rollType}` : ''}`} aria-hidden="true">
      {cells.map((n) => (
        <span
          key={n}
          className={[
            'meter__cell',
            zone(n, mood),
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
