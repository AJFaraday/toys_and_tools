import { Character } from '../game/characters';
import { GameConfig } from '../game/config';
import { MoodType, abilityLabel, moodType } from '../game/rules';
import { ItemIcon } from './ui/ItemIcon';
import { MoodMeter } from './ui/MoodMeter';
import { REVEAL_STEP_MS, reveal } from './ui/motion';

const MOOD_INDEX = 4;

const moodTypeLabel: Record<MoodType, string> = { toys: 'toys mood', tools: 'tools mood', neutral: 'neutral mood' };

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
      {/* Tool on the left and toy on the right, matching their sides of the mood meter. */}
      <div {...reveal(animate, 1, 'details__item details__item--tools')}>
        <dt className="visually-hidden">Tool</dt>
        <dd>
          <ItemIcon name={character.tool} items={config.tools} />
        </dd>
      </div>
      <div {...reveal(animate, 2, 'details__item details__item--toys')}>
        <dt className="visually-hidden">Toy</dt>
        <dd>
          <ItemIcon name={character.toy} items={config.toys} />
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
      <div {...reveal(animate, MOOD_INDEX, 'details__mood')}>
        <dt className="visually-hidden">Mood</dt>
        <dd>
          <span className="visually-hidden">
            {mood} ({moodTypeLabel[mType]})
          </span>
          <MoodMeter mood={mood} introDelay={animate ? MOOD_INDEX * REVEAL_STEP_MS + 100 : undefined} {...meter} />
        </dd>
      </div>
    </dl>
  );
};
