import { CSSProperties, createContext, useCallback, useContext, useEffect, useState } from 'react';

// Whether to animate. Off for people who ask for reduced motion, and in tests.
export const MotionContext = createContext(false);

export const useMotion = (): boolean => useContext(MotionContext);

export const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The value when the component first mounted, so things already on screen (e.g. after a reload) aren't animated again.
export const useMountValue = <T>(value: T): T => useState(() => value)[0];

interface Timeline {
  step: number;
  done: boolean;
  skip: () => void;
}

// Steps through `delays` (the wait before each step) and restarts whenever `key` changes.
// When inactive it starts already finished.
export const useTimeline = (delays: readonly number[], key: unknown, active: boolean): Timeline => {
  const start = active ? 0 : delays.length;
  const [current, setCurrent] = useState({ key, step: start });
  // Resetting during render (rather than in an effect) means a finished frame is never shown before the restart.
  if (current.key !== key) setCurrent({ key, step: start });
  const step = current.key === key ? current.step : start;

  useEffect(() => {
    if (step >= delays.length) return undefined;
    const timer = window.setTimeout(() => setCurrent((c) => ({ ...c, step: c.step + 1 })), delays[step]);
    return () => window.clearTimeout(timer);
  }, [step, delays]);

  const skip = useCallback(() => setCurrent((c) => ({ ...c, step: delays.length })), [delays.length]);
  return { step, done: step >= delays.length, skip };
};

export const REVEAL_STEP_MS = 450;
// The story is read aloud, so each phrase gets time to land.
export const STORY_STEP_MS = 1500;

// Props for something that fades in as the `index`th item of a group.
export const reveal = (
  animate: boolean,
  index: number,
  className = '',
  stepMs = REVEAL_STEP_MS,
): { className?: string; style?: CSSProperties } => {
  if (!animate) return className ? { className } : {};
  return { className: `${className} reveal`.trim(), style: { animationDelay: `${index * stepMs}ms` } };
};

// Wait times that grow, so things slow down as they settle.
export const slowingDelays = (count: number, first: number, growth: number): number[] =>
  Array.from({ length: count }, (_, i) => Math.round(first * growth ** i));
