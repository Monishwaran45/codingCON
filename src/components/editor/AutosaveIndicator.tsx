import React from 'react';

interface AutosaveIndicatorProps {
  lastSavedAt: string | null;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({ lastSavedAt }) => {
  return (
    <div className="font-inter text-[0.68rem] text-zinc-400 flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span>{lastSavedAt ? `Saved ${lastSavedAt}` : 'Autosave active'}</span>
    </div>
  );
};
