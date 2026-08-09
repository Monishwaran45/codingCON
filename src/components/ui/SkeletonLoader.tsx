import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-zinc-200/70 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800/50',
            className
          )}
        />
      ))}
    </>
  );
};
