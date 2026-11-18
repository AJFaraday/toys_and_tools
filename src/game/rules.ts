import { RollType } from './config';
import { DiceRoll } from './dice';

export const NEUTRAL_MOOD = 7;

export type MoodType = RollType | 'neutral';

export interface RollResult {
  rollType: RollType;
  dice: [number, number];
  total: number;
  mood: number;
  passed: boolean;
  margin: number;
  ability?: string;
}

export const moodType = (mood: number): MoodType => {
  if (mood > NEUTRAL_MOOD) return 'tools';
  if (mood < NEUTRAL_MOOD) return 'toys';
  return 'neutral';
};

// Toys rolls pass at or above the mood; tools rolls pass at or below it.
export const resolveRoll = (rollType: RollType, mood: number, roll: DiceRoll): RollResult => {
  const margin = rollType === 'toys' ? roll.total - mood : mood - roll.total;
  return {
    rollType,
    dice: roll.dice,
    total: roll.total,
    mood,
    passed: margin >= 0,
    margin,
  };
};

export const rollTypeLabel = (rollType: RollType): string => (rollType === 'toys' ? 'Toys' : 'Tools');

export const abilityLabel = (rollType: RollType): string => (rollType === 'toys' ? 'Toy' : 'Tool');

export const describeOutcome = (result: RollResult): string => {
  if (result.margin === 0) return 'Pass (exactly on mood)';
  return result.passed ? `Pass by ${result.margin}` : `Fail by ${Math.abs(result.margin)}`;
};
