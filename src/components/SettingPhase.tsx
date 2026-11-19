import { Dispatch, FormEvent, useState } from 'react';
import { GameConfig, effectiveMaxPlayers } from '../game/config';
import { Rng } from '../game/dice';
import { SettingLine, generateSetting, isSettingComplete, needsInput } from '../game/setting';
import { GameAction, GameState } from '../game/state';
import { Story } from './Story';
import { reveal, useMotion, useMountValue } from './ui/motion';

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
    <form onSubmit={handleSubmit} className="questions">
      {lines.map((line, i) => (
        <p key={line.blockId}>
          <label className="question">
            <span className="question__label">{line.inputLabel}</span>{' '}
            <input
              type="text"
              className="text-input"
              autoFocus={i === 0}
              value={answers[line.blockId] ?? ''}
              onChange={(e) => setAnswers({ ...answers, [line.blockId]: e.target.value })}
            />
          </label>
        </p>
      ))}
      <button type="submit" className="btn btn--primary" disabled={!allAnswered}>
        Done
      </button>
    </form>
  );
};

export const SettingPhase = ({ state, dispatch, rng, config }: Props) => {
  const motion = useMotion();
  // A story already finished when this screen appeared (e.g. after a reload) is shown without fading in.
  const storyIsNew = useMountValue(!isSettingComplete(state.setting));
  const { minPlayers } = config.rules;
  const playerOptions = Array.from(
    { length: effectiveMaxPlayers(config) - minPlayers + 1 },
    (_, i) => minPlayers + i,
  );

  const renderStory = (setting: SettingLine[]) => {
    if (!isSettingComplete(setting)) return <StoryQuestions lines={setting.filter(needsInput)} dispatch={dispatch} />;
    const animate = motion && storyIsNew;
    return (
      <>
        <Story setting={setting} playerCount={state.playerCount} rules={config.rules} animate={animate} />
        <p {...reveal(animate, setting.length + 1, 'actions')}>
          <button type="button" className="btn btn--primary btn--big" onClick={() => dispatch({ type: 'START_CHARACTERS' })}>
            Continue to character creation <span aria-hidden="true">▶</span>
          </button>
        </p>
      </>
    );
  };

  return (
    <section className="panel">
      <h2>The setting</h2>
      {state.setting === null ? (
        <>
          <p className="players">
            <label className="players__label">
              Number of players{' '}
              <select
                autoFocus
                className="players__select"
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
            <span className="players__icons" aria-hidden="true">
              {Array.from({ length: state.playerCount }, (_, i) => (
                <span key={i} className="players__icon">
                  🧒
                </span>
              ))}
            </span>
          </p>
          <p className="actions">
            <button
              type="button"
              className="btn btn--primary btn--big"
              onClick={() => dispatch({ type: 'GENERATE_SETTING', setting: generateSetting(rng, config) })}
            >
              <span aria-hidden="true">📜</span> Generate story
            </button>
          </p>
        </>
      ) : (
        renderStory(state.setting)
      )}
    </section>
  );
};
