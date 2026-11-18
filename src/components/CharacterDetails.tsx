import { Character } from '../game/characters';
import { abilityLabel, moodType } from '../game/rules';

const moodTypeLabel = { toys: 'toys mood', tools: 'tools mood', neutral: 'neutral mood' };

interface Props {
  character: Character;
}

export const CharacterDetails = ({ character }: Props) => (
  <dl>
    <dt>Toy</dt>
    <dd>{character.toy}</dd>
    <dt>Tool</dt>
    <dd>{character.tool}</dd>
    <dt>Special ability</dt>
    <dd>
      {character.ability.name} ({abilityLabel(character.ability.rollType)})
    </dd>
    <dt>Mood</dt>
    <dd>
      {character.mood} ({moodTypeLabel[moodType(character.mood)]})
    </dd>
  </dl>
);
