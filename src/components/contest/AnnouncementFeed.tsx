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
    <div className="font-jetbrains rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
        <span className="text-cyan-400">📢</span> Contest Announcements
      </h3>

      <div className="space-y-2">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/80 p-3 text-xs"
          >
            <span className="shrink-0 font-bold text-slate-500">{item.timestamp}</span>
            <p className="text-slate-200">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
