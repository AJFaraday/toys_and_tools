import { Dispatch } from 'react';
import { GameConfig } from '../game/config';
import { Rng, roll2d6 } from '../game/dice';
import { resolveRoll } from '../game/rules';
import { GameAction, GameState, abilityUsesRemaining, isLastChapter, rollsRemaining } from '../game/state';
import { CharacterCard } from './CharacterCard';

interface Props {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  rng: Rng;
  config: GameConfig;
}

export const GameplayPhase = ({ state, dispatch, rng, config }: Props) => {
  const lastChapter = isLastChapter(state, config);

  return (
    <section>
      <h2>
        Chapter {state.chapterIndex + 1} of {config.chapters.length}: {config.chapters[state.chapterIndex]}
      </h2>
      <p>
        <button type="button" disabled={state.chapterIndex === 0} onClick={() => dispatch({ type: 'PREV_CHAPTER' })}>
          Previous chapter
        </button>{' '}
        {lastChapter ? (
          <button type="button" onClick={() => dispatch({ type: 'FINISH' })}>
            Finish adventure
          </button>
        ) : (
          <button type="button" onClick={() => dispatch({ type: 'NEXT_CHAPTER' })}>
            Next chapter
          </button>
        )}
      </p>

      {state.characters.map((character) => (
        <CharacterCard
          key={character.id}
          character={character}
          rollsRemaining={rollsRemaining(state, character.id, config)}
          rollsPerChapter={config.rules.rollsPerChapter}
          abilityUsesRemaining={abilityUsesRemaining(state, character.id, config)}
          abilityUsesPerGame={config.rules.abilityUsesPerGame}
          lastRoll={state.lastRoll[character.id]}
          onRoll={(rollType) =>
            dispatch({
              type: 'ROLL',
              characterId: character.id,
              result: resolveRoll(rollType, character.mood, roll2d6(rng)),
            })
          }
          onUseAbility={() =>
            dispatch({
              type: 'USE_ABILITY',
              characterId: character.id,
              result: resolveRoll(character.ability.rollType, character.mood, roll2d6(rng)),
            })
          }
        />
      ))}
    </section>
  );
};
