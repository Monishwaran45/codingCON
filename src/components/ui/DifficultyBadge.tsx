import React from 'react';
import { Difficulty } from '@/types';
import { DIFFICULTY_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, className }) => {
  return (
    <span
      className={cn(
        'font-jetbrains text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider',
        DIFFICULTY_COLORS[difficulty],
        className
      )}
    >
      {difficulty}
    </span>
  );
};
