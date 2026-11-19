import { Dispatch, FormEvent, useEffect, useRef, useState } from 'react';
import { createCharacter } from '../game/characters';
import { GameConfig } from '../game/config';
import { Rng } from '../game/dice';
import { GameAction, GameState } from '../game/state';
import { loadNames, saveName } from '../game/storage';
import { CharacterDetails } from './CharacterDetails';
import { reveal, useMotion, useMountValue } from './ui/motion';

interface Props {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  rng: Rng;
  config: GameConfig;
}

interface NameFormProps {
  index: number;
  playerCount: number;
  onSubmit: (name: string) => void;
}

const NameForm = ({ index, playerCount, onSubmit }: NameFormProps) => {
  const [name, setName] = useState(() => loadNames()[index] ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Selecting a remembered name means typing replaces it, and Enter keeps it.
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;
    saveName(index, name.trim());
    onSubmit(name);
  };

  return (
    <form onSubmit={handleSubmit} className="name-form">
      <label className="name-form__label">
        <span className="name-form__prompt">
          Name of character {index + 1} of {playerCount}
        </span>{' '}
        <input ref={inputRef} type="text" className="text-input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>{' '}
      <button type="submit" className="btn btn--primary" disabled={name.trim() === ''}>
        <span aria-hidden="true">✨</span> Create character
      </button>
    </form>
  );
};

const DETAILS_COUNT = 5; // name, toy, tool, ability, mood

export const CharacterPhase = ({ state, dispatch, rng, config }: Props) => {
  const motion = useMotion();
  // Characters made before this screen appeared (e.g. before a reload) are shown without fading in.
  const existing = useMountValue(new Set(state.characters.map((c) => c.id)));
  const allCreated = state.characters.length >= state.playerCount;
  const lastIsNew = state.characters.length > 0 && !existing.has(state.characters[state.characters.length - 1].id);

  const addCharacter = (name: string) =>
    dispatch({ type: 'ADD_CHARACTER', character: createCharacter(name, state.characters, rng, config) });

  return (
    <section className="panel">
      <h2>Character creation</h2>

      <div className="cards">
        {state.characters.map((character) => {
          const animate = motion && !existing.has(character.id);
          return (
            <article key={character.id} aria-label={character.name} className="card">
              <h3 {...reveal(animate, 0, 'card__name')}>{character.name}</h3>
              <CharacterDetails character={character} config={config} animate={animate} />
            </article>
          );
        })}
      </div>

      {allCreated ? (
        <p {...reveal(motion && lastIsNew, DETAILS_COUNT, 'actions')}>
          <button type="button" className="btn btn--primary btn--big" onClick={() => dispatch({ type: 'START_GAMEPLAY' })}>
            <span aria-hidden="true">🚀</span> Start adventure
          </button>
        </p>
      ) : (
        <div {...reveal(motion && lastIsNew, DETAILS_COUNT)}>
          <NameForm
            key={state.characters.length}
            index={state.characters.length}
            playerCount={state.playerCount}
            onSubmit={addCharacter}
          />
        </div>
      )}
    </section>
  );
};
