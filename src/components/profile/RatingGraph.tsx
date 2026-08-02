'use client';

import React from 'react';

interface RatingHistoryPoint {
  date: string;
  rating: number;
}

interface RatingGraphProps {
  history: RatingHistoryPoint[];
}

export const RatingGraph: React.FC<RatingGraphProps> = ({ history }) => {
  if (!history || history.length === 0) return null;

  const minRating = Math.min(...history.map((h) => h.rating)) - 100;
  const maxRating = Math.max(...history.map((h) => h.rating)) + 100;
  const range = maxRating - minRating;

  const width = 600;
  const height = 180;
  const padding = 20;

  const points = history
    .map((h, i) => {
      const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((h.rating - minRating) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="font-jetbrains rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Rating Trajectory
          </h3>
          <p className="text-xs text-slate-400">
            Historical competitive performance progress
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block">Current Rating</span>
          <span className="text-lg font-extrabold text-cyan-400">
            {history[history.length - 1].rating} pts
          </span>
        </div>
      </div>

      {/* SVG Line Graph */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="4 4" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="4 4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" />

          {/* Polyline Path */}
          <polyline
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Data Dots */}
          {history.map((h, i) => {
            const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((h.rating - minRating) / range) * (height - 2 * padding);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                className="fill-cyan-400 stroke-slate-950 stroke-2 hover:r-6 transition-all cursor-pointer"
              >
                <title>{`${h.date}: ${h.rating} pts`}</title>
              </circle>
            );
          })}

          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
