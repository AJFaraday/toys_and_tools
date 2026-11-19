import { Rules } from '../game/config';
import { SettingLine, introParts } from '../game/setting';
import { STORY_STEP_MS, reveal } from './ui/motion';

interface Props {
  setting: SettingLine[];
  playerCount: number;
  rules: Rules;
  animate?: boolean;
}

// The story intro, with each randomly chosen part picked out, fading in phrase by phrase when it's new.
export const Story = ({ setting, playerCount, rules, animate = false }: Props) => {
  const parts = introParts(setting, playerCount, rules);
  return (
    <p className="story" data-testid="story">
      {parts.map((part, i) => (
        <span key={i} {...reveal(animate, i, 'story__part', STORY_STEP_MS)}>
          {part.leadIn} <strong className={`story__choice story__choice--${i % 4}`}>{part.text}</strong>
          {i === parts.length - 1 ? '.' : ', '}
        </span>
      ))}
    </p>
  );
};
