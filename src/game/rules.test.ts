import { describeOutcome, moodType, resolveRoll } from './rules';

describe('moodType', () => {
  it.each([
    [2, 'toys'],
    [6, 'toys'],
    [7, 'neutral'],
    [8, 'tools'],
    [12, 'tools'],
  ])('mood %i is a %s mood', (mood, expected) => {
    expect(moodType(mood)).toBe(expected);
  });
});

describe('resolveRoll', () => {
  const roll = (total: number) => ({ dice: [1, total - 1] as [number, number], total });

  it('passes a toys roll at or above the mood', () => {
    expect(resolveRoll('toys', 7, roll(9))).toMatchObject({ passed: true, margin: 2 });
    expect(resolveRoll('toys', 7, roll(7))).toMatchObject({ passed: true, margin: 0 });
    expect(resolveRoll('toys', 7, roll(4))).toMatchObject({ passed: false, margin: -3 });
  });

  it('passes a tools roll at or below the mood', () => {
    expect(resolveRoll('tools', 8, roll(5))).toMatchObject({ passed: true, margin: 3 });
    expect(resolveRoll('tools', 8, roll(8))).toMatchObject({ passed: true, margin: 0 });
    expect(resolveRoll('tools', 8, roll(12))).toMatchObject({ passed: false, margin: -4 });
  });

  it('records the dice, total, mood and roll type', () => {
    expect(resolveRoll('tools', 6, { dice: [2, 3], total: 5 })).toEqual({
      rollType: 'tools',
      dice: [2, 3],
      total: 5,
      mood: 6,
      passed: true,
      margin: 1,
    });
  });
});

describe('describeOutcome', () => {
  const result = (margin: number) => ({
    rollType: 'toys' as const,
    dice: [1, 1] as [number, number],
    total: 2,
    mood: 2,
    passed: margin >= 0,
    margin,
  });

  it('describes passes, failures and exact hits', () => {
    expect(describeOutcome(result(3))).toBe('Pass by 3');
    expect(describeOutcome(result(-2))).toBe('Fail by 2');
    expect(describeOutcome(result(0))).toBe('Pass (exactly on mood)');
  });
});
