import { Dispatch, FormEvent, useState } from 'react';
import { createCharacter } from '../game/characters';
import { GameConfig } from '../game/config';
import { Rng } from '../game/dice';
import { GameAction, GameState } from '../game/state';
import { CharacterDetails } from './CharacterDetails';

interface Props {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  rng: Rng;
  config: GameConfig;
}

export const CharacterPhase = ({ state, dispatch, rng, config }: Props) => {
  const [name, setName] = useState('');
  const allCreated = state.characters.length >= state.playerCount;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() === '' || allCreated) return;
    dispatch({ type: 'ADD_CHARACTER', character: createCharacter(name, state.characters, rng, config) });
    setName('');
  };

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
        <form key={state.characters.length} onSubmit={handleSubmit}>
          <label>
            Name of character {state.characters.length + 1} of {state.playerCount}{' '}
            <input type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </label>{' '}
          <button type="submit" disabled={name.trim() === ''}>
            Create character
          </button>
        </form>
      )}
    </section>
  );
};
