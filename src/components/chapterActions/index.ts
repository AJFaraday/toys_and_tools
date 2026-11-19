import { ComponentType } from 'react';
import { ChapterAction } from '../../game/config';
import { StoryDice } from './StoryDice';
import { ChapterActionProps } from './types';

// Every action allowed in chapters.json must have a component here.
export const chapterActionComponents: Record<ChapterAction, ComponentType<ChapterActionProps>> = {
  StoryDice,
};
