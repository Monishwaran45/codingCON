'use client';

import React, { useEffect, useState } from 'react';

export const LiveStatTicker: React.FC = () => {
  const [activeSolvers, setActiveSolvers] = useState(1482);
  const [hourlySubmissions, setHourlySubmissions] = useState(3840);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSolvers((prev) => prev + Math.floor(Math.random() * 5 - 2));
      setHourlySubmissions((prev) => prev + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-jetbrains flex items-center justify-center gap-6 rounded-full border border-slate-800 bg-slate-900/60 px-6 py-2.5 text-xs text-slate-400 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>
          <strong className="text-slate-100">{activeSolvers.toLocaleString()}</strong> coders solving right now
        </span>
      </div>
      <span className="text-slate-700">•</span>
      <div className="flex items-center gap-2">
        <span className="text-cyan-400">⚡</span>
        <span>
          <strong className="text-slate-100">{hourlySubmissions.toLocaleString()}</strong> submissions past hour
        </span>
      </div>
    </div>
  );
};
