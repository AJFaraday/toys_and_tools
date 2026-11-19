import { Dispatch } from 'react';
import { GameConfig } from '../../game/config';
import { Rng } from '../../game/dice';
import { GameAction, GameState } from '../../game/state';

export interface ChapterActionProps {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  rng: Rng;
  config: GameConfig;
}
