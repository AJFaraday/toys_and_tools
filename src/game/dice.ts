export type Rng = () => number;

export interface DiceRoll {
  dice: [number, number];
  total: number;
}

export const DIE_SIDES = 6;

export const rollDie = (rng: Rng): number => Math.floor(rng() * DIE_SIDES) + 1;

export const roll2d6 = (rng: Rng): DiceRoll => {
  const dice: [number, number] = [rollDie(rng), rollDie(rng)];
  return { dice, total: dice[0] + dice[1] };
};

export const pickRandom = <T>(items: readonly T[], rng: Rng): T => {
  if (items.length === 0) throw new Error('Cannot pick from an empty list');
  return items[Math.floor(rng() * items.length)];
};
