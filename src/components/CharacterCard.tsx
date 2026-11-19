import { useMemo } from 'react';
import { Character } from '../game/characters';
import { GameConfig, RollType } from '../game/config';
import { rollDie } from '../game/dice';
import { RollResult, describeOutcome, rollTypeLabel } from '../game/rules';
import { CharacterDetails } from './CharacterDetails';
import { Die } from './ui/Die';
import { Pips } from './ui/Pips';
import { slowingDelays, useMotion, useMountValue, useTimeline } from './ui/motion';

interface Props {
  character: Character;
  config: GameConfig;
  rollsRemaining: number;
  rollsPerChapter: number;
  abilityUsesRemaining: number;
  abilityUsesPerGame: number;
  lastRoll?: RollResult;
  onRoll: (rollType: RollType) => void;
  onUseAbility: () => void;
}

// Tools on the left and toys on the right, matching their sides of the mood meter.
const ROLL_TYPES: RollType[] = ['tools', 'toys'];
export const rollTypeIcon: Record<RollType, string> = { toys: '🧸', tools: '🛠️' };

// The dice tumble and slow down, then a marker hops from the mood to the total, slowing as it goes.
const DICE_DELAYS = slowingDelays(8, 50, 1.2);
const PAUSE_BEFORE_HOPS = 250;
const PAUSE_BEFORE_RESULT = 350;
const hopDelays = (hops: number) => slowingDelays(hops, 80, 1.15);

const rollSummary = (roll: RollResult): string =>
  `${roll.ability ? `${roll.ability}: ` : ''}${rollTypeLabel(roll.rollType)} roll: ${roll.dice[0]} + ${roll.dice[1]} = ${roll.total} against mood ${roll.mood} — ${describeOutcome(roll)}`;

const rollTimeline = (roll: RollResult | undefined): number[] =>
  roll ? [...DICE_DELAYS, PAUSE_BEFORE_HOPS, ...hopDelays(Math.abs(roll.total - roll.mood)), PAUSE_BEFORE_RESULT] : [];

const useRollAnimation = (lastRoll: RollResult | undefined) => {
  const motion = useMotion();
  // Only rolls made while this card is on screen are animated, not ones restored after a reload.
  const initialRoll = useMountValue(lastRoll);
  const delays = useMemo(() => rollTimeline(lastRoll), [lastRoll]);
  const { step, done, skip } = useTimeline(delays, lastRoll, motion && lastRoll !== undefined && lastRoll !== initialRoll);
  if (!lastRoll) return { done, skip };

  const tumbling = step < DICE_DELAYS.length;
  const distance = lastRoll.total - lastRoll.mood;
  const hops = done ? Math.abs(distance) : Math.min(Math.max(step - DICE_DELAYS.length, 0), Math.abs(distance));
  return {
    done,
    skip,
    tumbling,
    dice: tumbling ? [rollDie(Math.random), rollDie(Math.random)] : lastRoll.dice,
    token: tumbling ? undefined : lastRoll.mood + Math.sign(distance) * hops,
  };
};

export const CharacterCard = ({
  character,
  config,
  rollsRemaining,
  rollsPerChapter,
  abilityUsesRemaining,
  abilityUsesPerGame,
  lastRoll,
  onRoll,
  onUseAbility,
}: Props) => {
  const { done, skip, tumbling, dice, token } = useRollAnimation(lastRoll);
  const outcome = lastRoll && done ? (lastRoll.passed ? 'pass' : 'fail') : undefined;
  const { ability } = character;

  return (
    <article aria-label={character.name} className="card">
      <h3 className="card__name">{character.name}</h3>
      <CharacterDetails character={character} config={config} meter={{ token, rollType: lastRoll?.rollType, outcome }} />

      <div
        className={`roll${lastRoll ? ` roll--${lastRoll.rollType}` : ''}${done ? '' : ' roll--animating'}`}
        onClick={done ? undefined : skip}
        title={done ? undefined : 'Tap to skip'}
      >
        {lastRoll && dice && (
          <span className="roll__dice">
            <span className="roll__type" aria-hidden="true">
              {lastRoll.ability ? ability.emoji ?? rollTypeIcon[lastRoll.rollType] : rollTypeIcon[lastRoll.rollType]}
            </span>
            <Die value={dice[0]} rolling={tumbling} />
            <Die value={dice[1]} rolling={tumbling} />
          </span>
        )}
        <p role="status" className="roll__status">
          {lastRoll && done && (
            <>
              <span className={`roll__result roll__result--${outcome}`} aria-hidden="true">
                <span className="roll__result-icon">{lastRoll.passed ? '✅' : '❌'}</span>
                <span className="roll__result-margin">{lastRoll.margin === 0 ? '🎯' : Math.abs(lastRoll.margin)}</span>
              </span>
              <span className="visually-hidden">{rollSummary(lastRoll)}</span>
            </>
          )}
        </p>
      </div>

      <div className="card__counters">
        <Pips
          remaining={rollsRemaining}
          total={rollsPerChapter}
          label={`Rolls left this chapter: ${rollsRemaining} of ${rollsPerChapter}`}
        />
        <Pips
          remaining={abilityUsesRemaining}
          total={abilityUsesPerGame}
          symbol="⭐"
          label={`Special ability uses left: ${abilityUsesRemaining} of ${abilityUsesPerGame}`}
        />
      </div>

      <div className="card__actions">
        {ROLL_TYPES.map((rollType) => (
          <button
            key={rollType}
            type="button"
            className={`btn btn--${rollType}`}
            disabled={rollsRemaining === 0}
            onClick={() => onRoll(rollType)}
          >
            <span className="btn__icon" aria-hidden="true">
              {rollTypeIcon[rollType]}
            </span>{' '}
            Roll {rollTypeLabel(rollType)}
          </button>
        ))}
        <button
          type="button"
          className={`btn btn--ability btn--${ability.rollType}`}
          disabled={abilityUsesRemaining === 0}
          onClick={onUseAbility}
          aria-label={`Use ${ability.name} (${rollTypeLabel(ability.rollType)} roll)`}
        >
          <span className="btn__icon">{ability.emoji ?? '⭐'}</span> {ability.name}
        </button>
      </div>
    </article>
  );
};
