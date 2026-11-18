import { Rng } from './dice';

// Returns the given values in order, then repeats them.
export const sequenceRng = (...values: number[]): Rng => {
  let i = 0;
  return () => {
    const value = values[i % values.length];
    i += 1;
    return value;
  };
};

// An Rng value that makes rollDie return the given face.
export const face = (n: number): number => (n - 1) / 6;
