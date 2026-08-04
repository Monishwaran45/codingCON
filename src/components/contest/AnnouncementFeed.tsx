import React from 'react';

interface Announcement {
  id: string;
  timestamp: string;
  message: string;
}

interface AnnouncementFeedProps {
  announcements: Announcement[];
}

export const AnnouncementFeed: React.FC<AnnouncementFeedProps> = ({ announcements }) => {
  return (
    <div className="font-inter rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4">
      <h3 className="text-[0.62rem] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        Announcements
      </h3>

      <div className="space-y-2">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/80 p-3 text-xs"
          >
            <span className="shrink-0 font-mono text-[0.62rem] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
