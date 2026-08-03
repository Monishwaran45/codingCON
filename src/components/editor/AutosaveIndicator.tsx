import React from 'react';

interface AutosaveIndicatorProps {
  lastSavedAt: string | null;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({ lastSavedAt }) => {
  return (
<<<<<<< HEAD
    <div className="font-jetbrains text-[0.7rem] text-slate-500 flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
=======
    <div className="font-inter text-[0.68rem] text-zinc-400 flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
>>>>>>> f4becec8226ca9317ff9585eedcc5ba1074cda1d
      <span>{lastSavedAt ? `Saved ${lastSavedAt}` : 'Autosave active'}</span>
    </div>
  );
};
