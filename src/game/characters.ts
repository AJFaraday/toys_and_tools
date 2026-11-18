import { Ability, GameConfig, gameConfig } from './config';
import { Rng, pickRandom, roll2d6 } from './dice';

export interface Character {
  id: string;
  name: string;
  toy: string;
  tool: string;
  ability: Ability;
  mood: number;
}

const pickUnused = <T>(options: readonly T[], used: Set<string>, key: (item: T) => string, rng: Rng, kind: string): T => {
  const available = options.filter((option) => !used.has(key(option)));
  if (available.length === 0) throw new Error(`No unused ${kind} left to give a new character`);
  return pickRandom(available, rng);
};

export const createCharacter = (
  name: string,
  existing: readonly Character[],
  rng: Rng,
  config: GameConfig = gameConfig,
): Character => {
  const trimmed = name.trim();
  if (trimmed === '') throw new Error('A character needs a name');

  const toy = pickUnused(config.toys, new Set(existing.map((c) => c.toy)), (t) => t, rng, 'toys');
  const tool = pickUnused(config.tools, new Set(existing.map((c) => c.tool)), (t) => t, rng, 'tools');
  const ability = pickUnused(
    config.abilities,
    new Set(existing.map((c) => c.ability.name)),
    (a) => a.name,
    rng,
    'abilities',
  );

  return {
    id: `character-${existing.length + 1}`,
    name: trimmed,
    toy,
    tool,
    ability,
    mood: roll2d6(rng).total,
  };
};
