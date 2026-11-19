import { MAX_ROLL, MIN_ROLL } from '../../game/dice';

const FIRST_MOVE_MS = 25;
const LAST_MOVE_MS = 260;
const BOUNCE_PAUSE_MS = 120;

export interface MeterIntroFrame {
  // The cell acting as the mood for this frame.
  cursor: number;
  // Still filling for the first time: only cells up to the cursor are shown.
  filling: boolean;
  bounce?: 'top' | 'bottom';
}

const range = (from: number, to: number): number[] => {
  const step = from <= to ? 1 : -1;
  return Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => from + i * step);
};

// Fill up to the top and bounce, run down to the bottom and bounce, then come back up to rest on the mood.
export const meterIntroPath = (mood: number): MeterIntroFrame[] => [
  ...range(MIN_ROLL, MAX_ROLL).map((cursor) => ({
    cursor,
    filling: cursor < MAX_ROLL,
    ...(cursor === MAX_ROLL ? { bounce: 'top' as const } : {}),
  })),
  ...range(MAX_ROLL - 1, MIN_ROLL).map((cursor) => ({
    cursor,
    filling: false,
    ...(cursor === MIN_ROLL ? { bounce: 'bottom' as const } : {}),
  })),
  ...(mood > MIN_ROLL ? range(MIN_ROLL + 1, mood) : []).map((cursor) => ({ cursor, filling: false })),
];

// Wait before each frame: `startDelay` before the first, then moves that start quick and slow down
// steadily towards the end, with a little extra pause after each bounce.
export const meterIntroDelays = (mood: number, startDelay: number): number[] => {
  const path = meterIntroPath(mood);
  const moves = path.length - 1;
  const growth = moves > 1 ? (LAST_MOVE_MS / FIRST_MOVE_MS) ** (1 / (moves - 1)) : 1;
  return [
    startDelay,
    ...path.slice(1).map((_, i) => Math.round(FIRST_MOVE_MS * growth ** i) + (path[i].bounce ? BOUNCE_PAUSE_MS : 0)),
  ];
};

// What to show after `step` steps of the intro timeline; nothing before the first.
export const meterIntroFrame = (step: number, mood: number): MeterIntroFrame | null =>
  step === 0 ? null : meterIntroPath(mood)[step - 1] ?? null;
