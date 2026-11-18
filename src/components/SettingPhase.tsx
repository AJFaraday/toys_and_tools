import { Dispatch, FormEvent, useState } from 'react';
import { GameConfig, effectiveMaxPlayers } from '../game/config';
import { Rng } from '../game/dice';
import { SettingLine, generateSetting, isSettingComplete, needsInput, renderIntro } from '../game/setting';
import { GameAction, GameState } from '../game/state';

interface Props {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  rng: Rng;
  config: GameConfig;
}

interface QuestionsProps {
  lines: SettingLine[];
  dispatch: Dispatch<GameAction>;
}

// Answers stay local until submitted, so the story is only revealed once every question is answered.
const StoryQuestions = ({ lines, dispatch }: QuestionsProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const allAnswered = lines.every((line) => (answers[line.blockId] ?? '').trim() !== '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!allAnswered) return;
    lines.forEach((line) =>
      dispatch({ type: 'SET_SETTING_INPUT', blockId: line.blockId, input: answers[line.blockId].trim() }),
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {lines.map((line, i) => (
        <p key={line.blockId}>
          <label>
            {line.inputLabel}{' '}
            <input
              type="text"
              autoFocus={i === 0}
              value={answers[line.blockId] ?? ''}
              onChange={(e) => setAnswers({ ...answers, [line.blockId]: e.target.value })}
            />
          </label>
        </p>
      ))}
      <button type="submit" disabled={!allAnswered}>
        Done
      </button>
    </form>
  );
};

export const SettingPhase = ({ state, dispatch, rng, config }: Props) => {
  const { minPlayers } = config.rules;
  const playerOptions = Array.from(
    { length: effectiveMaxPlayers(config) - minPlayers + 1 },
    (_, i) => minPlayers + i,
  );

  const renderStory = (setting: SettingLine[]) =>
    isSettingComplete(setting) ? (
      <>
        <p>{renderIntro(setting, state.playerCount, config.rules)}</p>
        <button type="button" onClick={() => dispatch({ type: 'START_CHARACTERS' })}>
          Continue to character creation
        </button>
      </>
    ) : (
      <StoryQuestions lines={setting.filter(needsInput)} dispatch={dispatch} />
    );

  return (
    <section>
      <h2>The setting</h2>
      {state.setting === null ? (
        <>
          <p>
            <label>
              Number of players{' '}
              <select
                autoFocus
                value={state.playerCount}
                onChange={(e) => dispatch({ type: 'SET_PLAYER_COUNT', count: Number(e.target.value) })}
              >
                {playerOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </p>
          <button type="button" onClick={() => dispatch({ type: 'GENERATE_SETTING', setting: generateSetting(rng, config) })}>
            Generate story
          </button>
        </>
      ) : (
        renderStory(state.setting)
      )}
    </section>
  );
};
