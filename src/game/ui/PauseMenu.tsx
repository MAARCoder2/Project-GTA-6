import React from 'react';
import { Play, RotateCcw, Flag, Settings, Home, X } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onRestartMission?: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
  onReturnToTitle: () => void;
  activeMissionTitle?: string;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestartMission,
  onOpenMissions,
  onOpenSettings,
  onReturnToTitle,
  activeMissionTitle,
}) => {
  return (
    <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-6">
          <div>
            <h2 className="text-xl font-heading font-black text-neutral-100">SIMULATION PAUSED</h2>
            <p className="text-xs text-neutral-400 font-mono">APEX RESPONSE NETWORK</p>
          </div>
          <button
            onClick={onResume}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeMissionTitle && (
          <div className="bg-neutral-950/70 border border-amber-500/30 rounded-xl p-3 mb-4 text-xs font-mono">
            <span className="text-[10px] text-amber-400 uppercase block font-semibold">ACTIVE OPERATION</span>
            <span className="text-neutral-200 font-medium">{activeMissionTitle}</span>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" /> RESUME PLAY
          </button>

          {onRestartMission && (
            <button
              onClick={onRestartMission}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-heading font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" /> RESTART MISSION
            </button>
          )}

          <button
            onClick={onOpenMissions}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-heading font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Flag className="w-4 h-4 text-sky-400" /> MISSION DOSSIER
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-heading font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4 text-neutral-400" /> SETTINGS
          </button>

          <button
            onClick={onReturnToTitle}
            className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 font-heading text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
          >
            <Home className="w-4 h-4" /> MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
