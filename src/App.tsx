import { useEffect, useMemo, useReducer } from 'react';
import { CharacterPhase } from './components/CharacterPhase';
import { CompletePhase } from './components/CompletePhase';
import { GameplayPhase } from './components/GameplayPhase';
import { ResetButton } from './components/ResetButton';
import { SettingPhase } from './components/SettingPhase';
import { GameConfig, gameConfig } from './game/config';
import { Rng } from './game/dice';
import { renderIntro } from './game/setting';
import { advanceAction, createGameReducer, createInitialState } from './game/state';
import { clearGame, loadGame, loadPlayerCount, saveGame, savePlayerCount } from './game/storage';

interface Props {
  rng?: Rng;
  config?: GameConfig;
}

function App({ rng = Math.random, config = gameConfig }: Props) {
  const reducer = useMemo(
    () => createGameReducer(config, () => createInitialState(config, loadPlayerCount())),
    [config],
  );
  const [state, dispatch] = useReducer(reducer, undefined, () => loadGame() ?? createInitialState(config, loadPlayerCount()));

  useEffect(() => {
    // Nothing worth keeping until a story exists; a finished game is cleared too.
    if (state.phase === 'complete' || state.setting === null) clearGame();
    else saveGame(state);
    // Remembered separately, so the next game starts with the same number of players.
    if (state.phase === 'setting') savePlayerCount(state.playerCount);
  }, [state]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || e.isComposing || e.defaultPrevented) return;
      // Text fields submit their own forms on Enter.
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const action = advanceAction(state, rng, config);
      if (action === null) return;
      // Stops Enter also clicking a focused button (e.g. rolling again instead of moving on).
      e.preventDefault();
      dispatch(action);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, rng, config]);

  const reset = () => dispatch({ type: 'RESET' });
  const phaseProps = { state, dispatch, rng, config };
  const showStory = state.setting !== null && (state.phase === 'characters' || state.phase === 'gameplay');

  return (
    <main>
      <h1>Toys and Tools</h1>

      {state.phase !== 'complete' && <ResetButton onReset={reset} />}

      {showStory && state.setting && (
        <section>
          <h2>Our story</h2>
          <p>{renderIntro(state.setting, state.playerCount, config.rules)}</p>
        </section>
      )}

      {state.phase === 'setting' && <SettingPhase {...phaseProps} />}
      {state.phase === 'characters' && <CharacterPhase {...phaseProps} />}
      {state.phase === 'gameplay' && <GameplayPhase {...phaseProps} />}
      {state.phase === 'complete' && <CompletePhase onNewGame={reset} />}
    </main>
  );
}

export default App;
