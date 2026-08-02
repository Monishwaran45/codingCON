import React from 'react';

interface AutosaveIndicatorProps {
  lastSavedAt: string | null;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({ lastSavedAt }) => {
  return (
    <div className="font-jetbrains text-[0.7rem] text-slate-500 flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
      <span>{lastSavedAt ? `Saved ${lastSavedAt}` : 'Autosave active'}</span>
    </div>
  );
};
