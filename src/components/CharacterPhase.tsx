import { Dispatch, FormEvent, useEffect, useRef, useState } from 'react';
import { createCharacter } from '../game/characters';
import { GameConfig } from '../game/config';
import { Rng } from '../game/dice';
import { GameAction, GameState } from '../game/state';
import { loadNames, saveName } from '../game/storage';
import { CharacterDetails } from './CharacterDetails';

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
    <form onSubmit={handleSubmit}>
      <label>
        Name of character {index + 1} of {playerCount}{' '}
        <input ref={inputRef} type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </label>{' '}
      <button type="submit" disabled={name.trim() === ''}>
        Create character
      </button>
    </form>
  );
};

export const CharacterPhase = ({ state, dispatch, rng, config }: Props) => {
  const allCreated = state.characters.length >= state.playerCount;

  const addCharacter = (name: string) =>
    dispatch({ type: 'ADD_CHARACTER', character: createCharacter(name, state.characters, rng, config) });

  return (
    <section>
      <h2>Character creation</h2>

      {state.characters.map((character) => (
        <article key={character.id} aria-label={character.name}>
          <h3>{character.name}</h3>
          <CharacterDetails character={character} />
        </article>
      ))}

      {allCreated ? (
        <button type="button" onClick={() => dispatch({ type: 'START_GAMEPLAY' })}>
          Start adventure
        </button>
      ) : (
        <NameForm
          key={state.characters.length}
          index={state.characters.length}
          playerCount={state.playerCount}
          onSubmit={addCharacter}
        />
      )}
    </section>
  );
};
