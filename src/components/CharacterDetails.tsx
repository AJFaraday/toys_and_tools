import { Character } from '../game/characters';
import { GameConfig } from '../game/config';
import { MoodType, abilityLabel, moodType } from '../game/rules';
import { ItemIcon } from './ui/ItemIcon';
import { MoodMeter } from './ui/MoodMeter';
import { reveal } from './ui/motion';

const moodTypeLabel: Record<MoodType, string> = { toys: 'toys mood', tools: 'tools mood', neutral: 'neutral mood' };
export const moodTypeIcon: Record<MoodType, string> = { toys: '🧸', tools: '🛠️', neutral: '⚖️' };

interface Props {
  character: Character;
  config: GameConfig;
  // Fade each detail in, one after another, after the name.
  animate?: boolean;
  meter?: Omit<Parameters<typeof MoodMeter>[0], 'mood'>;
}

export const CharacterDetails = ({ character, config, animate = false, meter }: Props) => {
  const { ability, mood } = character;
  const mType = moodType(mood);
  return (
    <dl className="details">
      <div {...reveal(animate, 1, 'details__item details__item--toys')}>
        <dt className="visually-hidden">Toy</dt>
        <dd>
          <ItemIcon name={character.toy} items={config.toys} />
        </dd>
      </div>
      <div {...reveal(animate, 2, 'details__item details__item--tools')}>
        <dt className="visually-hidden">Tool</dt>
        <dd>
          <ItemIcon name={character.tool} items={config.tools} />
        </dd>
      </div>
      <div {...reveal(animate, 3, `details__item details__ability details__item--${ability.rollType}`)}>
        <dt className="visually-hidden">Special ability</dt>
        <dd>
          {ability.emoji && (
            <span className="details__ability-emoji" aria-hidden="true">
              {ability.emoji}
            </span>
          )}
          <span className="details__ability-name">{ability.name}</span>{' '}
          <span className={`badge badge--${ability.rollType}`}>{abilityLabel(ability.rollType)}</span>
        </dd>
      </div>
      <div {...reveal(animate, 4, 'details__mood')}>
        <dt className="visually-hidden">Mood</dt>
        <dd>
          <span className="visually-hidden">
            {mood} ({moodTypeLabel[mType]})
          </span>
          <span className={`mood-badge mood-badge--${mType}`} aria-hidden="true">
            <span className="mood-badge__icon">{moodTypeIcon[mType]}</span>
            <span className="mood-badge__number">{mood}</span>
          </span>
          <MoodMeter mood={mood} {...meter} />
        </dd>
      </div>
    </dl>
  );
};
