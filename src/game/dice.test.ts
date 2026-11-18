import { pickRandom, roll2d6, rollDie } from './dice';
import { face, sequenceRng } from './testUtils';

describe('rollDie', () => {
  it('maps the rng range onto faces 1 to 6', () => {
    expect(rollDie(() => 0)).toBe(1);
    expect(rollDie(() => 0.999999)).toBe(6);
    for (let n = 1; n <= 6; n += 1) {
      expect(rollDie(() => face(n))).toBe(n);
    }
  });
});

describe('roll2d6', () => {
  it('returns both dice and their total', () => {
    expect(roll2d6(sequenceRng(face(3), face(5)))).toEqual({ dice: [3, 5], total: 8 });
  });

  it('always totals between 2 and 12', () => {
    const totals = new Set<number>();
    for (let i = 0; i < 2000; i += 1) totals.add(roll2d6(Math.random).total);
    expect(Math.min(...Array.from(totals))).toBeGreaterThanOrEqual(2);
    expect(Math.max(...Array.from(totals))).toBeLessThanOrEqual(12);
  });
});

describe('pickRandom', () => {
  it('can pick any item in a list of any length', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    expect(pickRandom(items, () => 0)).toBe('a');
    expect(pickRandom(items, () => 0.999999)).toBe('i');
    expect(pickRandom(items, () => 4 / 9)).toBe('e');
  });

  it('throws for an empty list', () => {
    expect(() => pickRandom([], Math.random)).toThrow();
  });
});
