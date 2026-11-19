import { useEffect, useMemo, useReducer } from 'react';
import { CharacterPhase } from './components/CharacterPhase';
import { CompletePhase } from './components/CompletePhase';
import { GameplayPhase } from './components/GameplayPhase';
import { ResetButton } from './components/ResetButton';
import { SettingPhase } from './components/SettingPhase';
import { GameConfig, gameConfig } from './game/config';
import { Rng } from './game/dice';
import { Story } from './components/Story';
import { MotionContext, prefersReducedMotion } from './components/ui/motion';
import { advanceAction, createGameReducer, createInitialState } from './game/state';
import { clearGame, loadGame, loadPlayerCount, saveGame, savePlayerCount } from './game/storage';

interface Props {
  rng?: Rng;
  config?: GameConfig;
  animate?: boolean;
}

function App({ rng = Math.random, config = gameConfig, animate = !prefersReducedMotion() }: Props) {
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
    <MotionContext.Provider value={animate}>
      <main className="app">
        <header className="header">
          <h1 className="title">
            <span className="title__toys">
              <span aria-hidden="true">🧸 </span>Toys
            </span>{' '}
            <span className="title__and">and</span>{' '}
            <span className="title__tools">
              Tools<span aria-hidden="true"> 🛠️</span>
            </span>
          </h1>
          {state.phase !== 'complete' && <ResetButton onReset={reset} />}
        </header>

        {showStory && state.setting && (
          <section className="panel panel--story">
            <h2>Our story</h2>
            <Story setting={state.setting} playerCount={state.playerCount} rules={config.rules} />
          </section>
        )}

        {state.phase === 'setting' && <SettingPhase {...phaseProps} />}
        {state.phase === 'characters' && <CharacterPhase {...phaseProps} />}
        {state.phase === 'gameplay' && <GameplayPhase {...phaseProps} />}
        {state.phase === 'complete' && <CompletePhase onNewGame={reset} />}
      </main>
    </MotionContext.Provider>
  );
}


export default App;
