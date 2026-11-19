import { GameConfig, gameConfig } from './config';
import { Rng, pickRandom } from './dice';

export const rollStoryDice = (rng: Rng, config: GameConfig = gameConfig): string => pickRandom(config.storyDice, rng);
