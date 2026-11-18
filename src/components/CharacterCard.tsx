import { Character } from '../game/characters';
import { RollType } from '../game/config';
import { RollResult, describeOutcome, rollTypeLabel } from '../game/rules';
import { CharacterDetails } from './CharacterDetails';

interface Props {
  character: Character;
  rollsRemaining: number;
  rollsPerChapter: number;
  abilityUsesRemaining: number;
  abilityUsesPerGame: number;
  lastRoll?: RollResult;
  onRoll: (rollType: RollType) => void;
  onUseAbility: () => void;
}

const ROLL_TYPES: RollType[] = ['toys', 'tools'];

export const CharacterCard = ({
  character,
  rollsRemaining,
  rollsPerChapter,
  abilityUsesRemaining,
  abilityUsesPerGame,
  lastRoll,
  onRoll,
  onUseAbility,
}: Props) => (
  <article aria-label={character.name}>
    <h3>{character.name}</h3>
    <CharacterDetails character={character} />
    <p>
      Rolls left this chapter: {rollsRemaining} of {rollsPerChapter}
    </p>
    <p>
      Special ability uses left: {abilityUsesRemaining} of {abilityUsesPerGame}
    </p>
    <p>
      {ROLL_TYPES.map((rollType) => (
        <button key={rollType} type="button" disabled={rollsRemaining === 0} onClick={() => onRoll(rollType)}>
          Roll {rollTypeLabel(rollType)}
        </button>
      ))}{' '}
      <button type="button" disabled={abilityUsesRemaining === 0} onClick={onUseAbility}>
        Use {character.ability.name} ({rollTypeLabel(character.ability.rollType)} roll)
      </button>
    </p>
    <p role="status">
      {lastRoll && (
        <>
          {lastRoll.ability && `${lastRoll.ability}: `}
          {rollTypeLabel(lastRoll.rollType)} roll: {lastRoll.dice[0]} + {lastRoll.dice[1]} = {lastRoll.total} against
          mood {lastRoll.mood} — <strong>{describeOutcome(lastRoll)}</strong>
        </>
      )}
    </p>
  </article>
);
