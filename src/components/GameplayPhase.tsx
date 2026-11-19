import { Dispatch, useState } from 'react';
import { GameConfig } from '../game/config';
import { Rng, roll2d6 } from '../game/dice';
import { resolveRoll } from '../game/rules';
import { GameAction, GameState, abilityUsesRemaining, isLastChapter, rollsRemaining } from '../game/state';
import { CharacterCard } from './CharacterCard';
import { chapterActionComponents } from './chapterActions';
import { useMotion, useMountValue } from './ui/motion';

interface Props {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  rng: Rng;
  config: GameConfig;
}

export const GameplayPhase = ({ state, dispatch, rng, config }: Props) => {
  const motion = useMotion();
  const lastChapter = isLastChapter(state, config);
  const chapter = config.chapters[state.chapterIndex];
  // Only pop the chapter title in once the chapter has been changed, not on first showing.
  const firstChapter = useMountValue(state.chapterIndex);
  const [chapterChanged, setChapterChanged] = useState(false);
  if (!chapterChanged && state.chapterIndex !== firstChapter) setChapterChanged(true);

  return (
    <section className="panel">
      <div className="chapter">
        <h2 key={state.chapterIndex} className={`chapter__title${motion && chapterChanged ? ' pop' : ''}`}>
          <span className="chapter__number">
            Chapter {state.chapterIndex + 1} of {config.chapters.length}:
          </span>{' '}
          <span className="chapter__label">{chapter.label}</span>
        </h2>
        <ol className="chapter__progress" aria-hidden="true">
          {config.chapters.map((c, i) => (
            <li
              key={c.label}
              className={`chapter__dot${i < state.chapterIndex ? ' chapter__dot--done' : ''}${
                i === state.chapterIndex ? ' chapter__dot--current' : ''
              }`}
            />
          ))}
        </ol>
        <p className="chapter__nav">
          <button
            type="button"
            className="btn"
            disabled={state.chapterIndex === 0}
            onClick={() => dispatch({ type: 'PREV_CHAPTER' })}
          >
            <span aria-hidden="true">◀</span> Previous chapter
          </button>{' '}
          {lastChapter ? (
            <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'FINISH' })}>
              Finish adventure <span aria-hidden="true">🏁</span>
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'NEXT_CHAPTER' })}>
              Next chapter <span aria-hidden="true">▶</span>
            </button>
          )}
        </p>
      </div>

      {chapter.actions.map((action) => {
        const ChapterActionComponent = chapterActionComponents[action];
        return (
          <ChapterActionComponent
            key={`${state.chapterIndex}-${action}`}
            state={state}
            dispatch={dispatch}
            rng={rng}
            config={config}
          />
        );
      })}

      <div className="cards">
        {state.characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            config={config}
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
      </div>
    </section>
  );
};
