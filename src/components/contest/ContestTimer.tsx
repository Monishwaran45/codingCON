'use client';

import React, { useEffect, useState } from 'react';

interface ContestTimerProps {
  endTime?: string;
  durationMinutes?: number;
  onExpire?: () => void;
}

export function ContestTimer({ endTime, onExpire }: ContestTimerProps) {
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);

  useEffect(() => {
    if (!endTime) return;
    const end = new Date(endTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeftMs(0);
        if (onExpire) onExpire();
      } else {
        setTimeLeftMs(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  if (!endTime) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        LIVE CONTEST
      </div>
    );
  }

  if (timeLeftMs === null) return null;

  if (timeLeftMs <= 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold font-mono">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        CONTEST ENDED
      </div>
    );
  }

  const secondsTotal = Math.floor(timeLeftMs / 1000);
  const hours = Math.floor(secondsTotal / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;

  const isEndingSoon = hours === 0 && minutes < 15;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold font-mono transition-colors ${
        isEndingSoon
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isEndingSoon ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      <span>
        {hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
      <span className="text-[0.62rem] font-sans font-semibold opacity-80 uppercase tracking-wider">
        Time Left
      </span>
    </div>
  );
}
