import { meterIntroDelays, meterIntroFrame, meterIntroPath } from './meterIntro';

const cursors = (mood: number) => meterIntroPath(mood).map((f) => f.cursor);

describe('mood meter intro', () => {
  it('fills to the top, runs to the bottom, then comes back up to rest on the mood', () => {
    expect(cursors(5)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 3, 4, 5]);
    expect(meterIntroPath(5).filter((f) => f.filling)).toHaveLength(10);
    expect(meterIntroPath(5).filter((f) => f.bounce).map((f) => [f.cursor, f.bounce])).toEqual([
      [12, 'top'],
      [2, 'bottom'],
    ]);
  });

  it('ends at the bottom for a mood of 2 and climbs all the way back for 12', () => {
    expect(cursors(2).at(-1)).toBe(2);
    expect(cursors(2)).toHaveLength(21);
    expect(cursors(12).at(-1)).toBe(12);
  });

  it('starts quick and slows down towards the end, pausing after bounces', () => {
    const delays = meterIntroDelays(7, 1000);
    expect(delays).toHaveLength(meterIntroPath(7).length);
    expect(delays[0]).toBe(1000);
    const moves = delays.slice(1);
    expect(moves[0]).toBeLessThan(moves[moves.length - 1]);
    expect(moves[10]).toBeGreaterThan(moves[11]); // the pause after the top bounce
  });

  it('shows nothing before the first step', () => {
    expect(meterIntroFrame(0, 7)).toBeNull();
    expect(meterIntroFrame(1, 7)).toEqual({ cursor: 2, filling: true });
  });
});
